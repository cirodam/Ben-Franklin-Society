import fs from 'fs';
import path from 'path';
import { env } from '$env/dynamic/private';

export interface ArticleMetadata {
	title: string;
	category?: string;
	author?: string;
	created?: string;
	[key: string]: unknown;
}

export interface Article {
	slug: string;
	metadata: ArticleMetadata;
	content: string;
	rawContent: string;
}

/**
 * Get the encyclopedia directory path
 */
function getEncyclopediaPath(): string {
	return env.ENCYCLOPEDIA_PATH || path.join(process.cwd(), 'data/encyclopedia');
}

/**
 * Parse frontmatter from markdown content
 * Simple implementation - just extracts YAML between --- markers
 */
function parseFrontmatter(content: string): { metadata: ArticleMetadata; content: string } {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return {
			metadata: { title: 'Untitled' },
			content: content
		};
	}

	const [, yamlStr, markdown] = match;
	const metadata: ArticleMetadata = { title: 'Untitled' };

	// Simple YAML parser for basic key: value pairs
	yamlStr.split('\n').forEach((line) => {
		const colonIndex = line.indexOf(':');
		if (colonIndex > 0) {
			const key = line.substring(0, colonIndex).trim();
			const value = line.substring(colonIndex + 1).trim();
			metadata[key] = value;
		}
	});

	return { metadata, content: markdown.trim() };
}

/**
 * Get all articles
 */
export function getAllArticles(): Article[] {
	const encyclopediaPath = getEncyclopediaPath();

	if (!fs.existsSync(encyclopediaPath)) {
		return [];
	}

	const files = fs.readdirSync(encyclopediaPath).filter((file) => file.endsWith('.md'));

	return files.map((file) => {
		const slug = file.replace(/\.md$/, '');
		const filePath = path.join(encyclopediaPath, file);
		const rawContent = fs.readFileSync(filePath, 'utf-8');
		const { metadata, content } = parseFrontmatter(rawContent);

		return { slug, metadata, content, rawContent };
	});
}

/**
 * Get a single article by slug
 */
export function getArticle(slug: string): Article | null {
	const encyclopediaPath = getEncyclopediaPath();
	const filePath = path.join(encyclopediaPath, `${slug}.md`);

	if (!fs.existsSync(filePath)) {
		return null;
	}

	const rawContent = fs.readFileSync(filePath, 'utf-8');
	const { metadata, content } = parseFrontmatter(rawContent);

	return { slug, metadata, content, rawContent };
}

/**
 * Search articles by title or content
 */
export function searchArticles(query: string): Article[] {
	const articles = getAllArticles();
	const lowerQuery = query.toLowerCase();

	return articles.filter(
		(article) =>
			article.metadata.title.toLowerCase().includes(lowerQuery) ||
			article.content.toLowerCase().includes(lowerQuery)
	);
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(category: string): Article[] {
	return getAllArticles().filter(
		(article) => article.metadata.category?.toLowerCase() === category.toLowerCase()
	);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
	const articles = getAllArticles();
	const categories = new Set<string>();

	articles.forEach((article) => {
		if (article.metadata.category) {
			categories.add(article.metadata.category);
		}
	});

	return Array.from(categories).sort();
}
