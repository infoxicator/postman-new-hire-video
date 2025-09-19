import {
  Links,
  LinksFunction,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

export const meta: MetaFunction = () => {
  return [
    {
      title: "Postman Welcome Studio",
    },
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { property: "og:title", content: "Postman Welcome Studio" },
    {
      name: "description",
      content:
        "Generate polished, Postman-branded welcome videos for new hires. Upload a headshot, share role details, and download the finalized clip.",
    },
  ];
};

export const links: LinksFunction = () => [
  {
    rel: "icon",
    type: "image/x-icon",
    href: "/favicon.png",
  },
  {
    rel: "apple-touch-icon",
    href: "/favicon.png",
  },
];
export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="mt-14">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
