import { useEffect } from 'react'
import { type z } from 'zod'

export function useMcpUiInit() {
	useEffect(() => {
		window.parent.postMessage({ type: 'ui-lifecycle-iframe-ready' }, '*')

		const height = document.documentElement.scrollHeight
		const width = document.documentElement.scrollWidth

		window.parent.postMessage(
			{ type: 'ui-size-change', payload: { height, width } },
			'*',
		)
	}, [])
}

type MessageOptions = {
	schema?: z.ZodSchema
	signal?: AbortSignal
	timeoutMs?: number
}

type McpMessageReturnType<Options> = Promise<
	Options extends { schema: z.ZodSchema } ? z.infer<Options['schema']> : unknown
>

type McpMessageTypes = {
	tool: { toolName: string; params: Record<string, unknown> }
	prompt: { prompt: string }
	link: { url: string }
}

type McpMessageType = keyof McpMessageTypes

function sendMcpMessage<Options extends MessageOptions>(
	type: 'tool',
	payload: McpMessageTypes['tool'],
	options?: Options,
): McpMessageReturnType<Options>

function sendMcpMessage<Options extends MessageOptions>(
	type: 'prompt',
	payload: McpMessageTypes['prompt'],
	options?: Options,
): McpMessageReturnType<Options>

function sendMcpMessage<Options extends MessageOptions>(
	type: 'link',
	payload: McpMessageTypes['link'],
	options?: Options,
): McpMessageReturnType<Options>

function sendMcpMessage<TypeType extends McpMessageType>(
	type: TypeType,
	payload: McpMessageTypes[TypeType],
	options: MessageOptions = {},
): McpMessageReturnType<typeof options> {
	if (type === 'tool') {
		// Goose does not currentlly support tool calls, so change this to a prompt
		const { toolName, params } = payload as McpMessageTypes['tool']
		type = 'prompt' as TypeType
		payload = {
			prompt: `Please call the tool ${toolName} with the following parameters: ${JSON.stringify(params)}`,
		} as McpMessageTypes[TypeType]
	}

	const { signal: givenSignal, schema, timeoutMs = 3_000 } = options
	const timeoutSignal =
		typeof timeoutMs === 'number' ? AbortSignal.timeout(timeoutMs) : undefined
	const signals: AbortSignal[] = [
		givenSignal,
		timeoutSignal,
	].filter(Boolean) as AbortSignal[]
	const signal = signals.length > 0 ? AbortSignal.any(signals) : undefined

	const messageId = crypto.randomUUID()

	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new Error('Operation aborted before it began'))
			return
		}

		if (!window.parent || window.parent === window) {
			reject(new Error('No parent frame available'))
			return
		}
		window.parent.postMessage({ type, messageId, payload }, '*')

		function handleMessage(event: MessageEvent) {
			if (event.data.type === 'ui-message-response') {
				const {
					messageId: responseMessageId,
					payload: { response, error },
				} = event.data
				if (responseMessageId === messageId) {
					window.removeEventListener('message', handleMessage)

					if (error) return reject(new Error(error))

					if (!schema) return resolve(response)

					const parseResult = schema.safeParse(response)
					if (!parseResult.success) {
						return reject(new Error(parseResult.error.message))
					}
					return resolve(parseResult.data)
				}
			}
		}

		window.addEventListener('message', handleMessage, { signal })
	})
}

export { sendMcpMessage }

// Module-level queue for render data events
const renderDataQueue: Array<{ type: string; payload: any }> = []

// Set up global listener immediately when module loads (only in the client)
if (typeof document !== 'undefined') {
	window.addEventListener('message', (event) => {
		if (event.data?.type === 'ui-lifecycle-iframe-render-data') {
			renderDataQueue.push(event.data)
		}
	})
}

export function waitForRenderData<RenderData>(
	schema: z.ZodSchema<RenderData>,
	opts: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<RenderData> {
	const { signal: givenSignal, timeoutMs = 3_000 } = opts
	const timeoutSignal =
		typeof timeoutMs === 'number' ? AbortSignal.timeout(timeoutMs) : undefined

	const signals: AbortSignal[] = [
		givenSignal,
		timeoutSignal,
	].filter(Boolean) as AbortSignal[]
	const signal = AbortSignal.any(signals)

	return new Promise((resolve, reject) => {
		// Check if we already received the data
		const queuedEvent = renderDataQueue.find(
			(event) => event.type === 'ui-lifecycle-iframe-render-data',
		)
		if (queuedEvent) {
			const result = schema.safeParse(queuedEvent.payload.renderData)
			return result.success ? resolve(result.data) : reject(result.error)
		}

		// Otherwise, set up the normal listening logic

		function cleanup() {
			window.removeEventListener('message', handleMessage)
			signal.removeEventListener?.('abort', onAbort as EventListener)
		}

		function onAbort() {
			cleanup()
			const reason =
				(signal as any).reason ??
				new DOMException('Timed out waiting for render data', 'TimeoutError')
			reject(reason)
		}

		function handleMessage(event: MessageEvent) {
			if (event.data?.type !== 'ui-lifecycle-iframe-render-data') return

			const result = schema.safeParse(event.data.payload)
			cleanup()
			return result.success ? resolve(result.data) : reject(result.error)
		}

		signal.addEventListener('abort', onAbort, { once: true })
		window.addEventListener('message', handleMessage, {
			signal,
		})

		if (signal.aborted) onAbort()
	})
}
