export interface SlideItem {
	image: string;
	text: string; // <=200 chars
}

export interface StoryData {
	title: string;
	date: string;
	mainImage?: string;
	slides: SlideItem[];
	newHireName?: string;
}

export interface BigBadGroupProps {
	images: string[];
	aiSummary: string;
	title: string;
}

export interface ImageSlideGroupProps {
	imgs: string[];
	durationInFrames?: number;
}

export interface LogoFrameProps {
	index: number;
	img: string;
}

export interface TitleProps {
	titleText: string;
}

export interface TextSlideGroupProps {
	strings: string[];
	durationInFrames: number;
}

export interface EndFrameProps {
	callToAction: string;
}

export interface ImageTestProps {
	img: string;
	index: number;
	frames: number;
}
