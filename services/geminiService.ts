
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SEOAnalysis, RelatedTerm, GeneratedArticle } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    totalVolumeLast6Months: { type: Type.INTEGER, description: "Estimated total searches in the last 6 months" },
    averageMonthlyVolume: { type: Type.INTEGER, description: "Average monthly search volume" },
    cpcGoogle: { type: Type.NUMBER, description: "Estimated Cost Per Click (CPC) for Google Ads in local currency" },
    cpcMeta: { type: Type.NUMBER, description: "Estimated Cost Per Click (CPC) for Meta Ads in local currency" },
    currencySymbol: { type: Type.STRING, description: "Currency symbol (e.g., R$, $, €, £)" },
    insightSummary: { type: Type.STRING, description: "A brief 1-sentence summary of the trend direction in Portuguese." },
    trendPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          month: { type: Type.STRING, description: "Month name (localized in PT-BR)" },
          searches: { type: Type.INTEGER, description: "Number of searches" },
        },
        required: ["month", "searches"],
      },
    },
    topRegions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "City or Region name" },
          volume: { type: Type.INTEGER, description: "Estimated monthly search volume (number, not score)" },
        },
        required: ["name", "volume"],
      },
    },
    relatedTerms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "Related keyword in the target language" },
          translatedTerm: { type: Type.STRING, description: "Translation of the term to Portuguese (PT-BR)" },
          searchVolume: { type: Type.INTEGER, description: "Monthly search volume estimate" }
        },
        required: ["term", "translatedTerm", "searchVolume"]
      },
    },
    commonSearchQueries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: "Actual search phrase used by people (e.g., 'buy X', 'X reviews', 'is X safe')" },
          translatedQuery: { type: Type.STRING, description: "Translation of the search phrase to Portuguese" }
        },
        required: ["query", "translatedQuery"]
      },
      description: "List of 6-8 common ways/phrases people use to search for this product in search engines."
    },
    articleTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "10 Viral/High-Engagement article titles in Portuguese"
    },
    affiliateAnalysis: {
      type: Type.OBJECT,
      properties: {
        viabilityScore: { type: Type.INTEGER, description: "0 to 100 score for affiliate marketing viability" },
        difficultyLevel: { type: Type.STRING, enum: ["Baixa", "Média", "Alta"] },
        productVerdict: { type: Type.STRING, description: "A Complete, deep analysis of the product, its market fit, and potential for sales. Written in Portuguese." },
        substackAnalysis: {
          type: Type.OBJECT,
          properties: {
            viability: { type: Type.STRING, enum: ["Baixa", "Média", "Alta"] },
            strategy: { type: Type.STRING, description: "Deep analysis of how to use Substack for this specific product. Best content angles, newsletter ideas." },
            seoImpact: { type: Type.STRING, description: "How this Substack strategy aids SEO and engagement." }
          },
          required: ["viability", "strategy", "seoImpact"]
        },
        lowCostStrategies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Strategy title in Portuguese" },
              description: { type: Type.STRING, description: "Strategy details in Portuguese" }
            },
            required: ["title", "description"]
          }
        }
      },
      required: ["viabilityScore", "difficultyLevel", "productVerdict", "substackAnalysis", "lowCostStrategies"]
    }
  },
  required: [
    "totalVolumeLast6Months",
    "averageMonthlyVolume",
    "cpcGoogle",
    "cpcMeta",
    "currencySymbol",
    "trendPoints",
    "topRegions",
    "relatedTerms",
    "commonSearchQueries",
    "articleTitles",
    "insightSummary",
    "affiliateAnalysis"
  ],
};

const articleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    seoTitlePt: { type: Type.STRING, description: "Optimized SEO Title in Portuguese" },
    seoSubtitlePt: { type: Type.STRING, description: "Optimized Meta Description in Portuguese" },
    seoSlugPt: { type: Type.STRING, description: "Optimized URL Slug in Portuguese (e.g. 'nome-do-artigo-guia')" },
    seoTitleNative: { type: Type.STRING, description: "Optimized SEO Title in English (or target language)" },
    seoSubtitleNative: { type: Type.STRING, description: "Optimized Meta Description in English (or target language)" },
    seoSlugNative: { type: Type.STRING, description: "Optimized URL Slug in English (e.g. 'article-name-guide')" },
    contentPt: { type: Type.STRING, description: "The complete blog article in Portuguese." },
    contentNative: { type: Type.STRING, description: "The complete blog article in English (or target language)." }
  },
  required: ["seoTitlePt", "seoSubtitlePt", "seoSlugPt", "seoTitleNative", "seoSubtitleNative", "seoSlugNative", "contentPt", "contentNative"]
};

export const fetchSEOAnalysis = async (keyword: string, countries: string): Promise<SEOAnalysis> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the search trends for the product/keyword: "${keyword}".
      Target Market(s): "${countries}".
      
      IMPORTANT RULES:
      1. Provide estimated data for the last 6 months. If "Global" is selected, aggregate worldwide data.
      2. Top Regions: If Global, list top Countries. If specific country, list top cities/regions. Provide estimated search volumes numbers.
      3. **Related Terms**: Provide the top keywords in the local language AND their Portuguese translation.
      4. **Common Search Queries**: Provide 6-8 specific phrases/questions people type into Google to find this (e.g., buying intent, reviews, comparisons) with PT translations.
      5. **Affiliate Analysis (Portuguese Only)**: 
         - Perform a COMPLETE analysis of the product for affiliates.
         - **Substack Deep Dive**: Specifically analyze the viability of creating a Substack blog. How can it generate high engagement? What is the best content path?
      6. **Article Titles**: Suggest 10 titles that are highly engaging, viral, or "click-worthy" to attract traffic.
      
      All text outputs must be in Portuguese (PT-BR), except the original related terms and native queries.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data received from Gemini");

    const data = JSON.parse(text);
    
    return {
      keyword,
      country: countries,
      ...data,
    };
  } catch (error) {
    console.error("Error fetching SEO analysis:", error);
    throw error;
  }
};

export const generateBlogPost = async (title: string, keyword: string, country: string, relatedTerms: RelatedTerm[]): Promise<GeneratedArticle> => {
  try {
    const termsString = relatedTerms.slice(0, 5).map(t => t.term).join(", ");
    
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an elite copywriter specializing in Viral Content and SEO.
      
      Task: Write a COMPLETE, detailed blog article based on the title: "${title}".
      Focus Keyword: "${keyword}".
      Context: ${country}.
      
      INSTRUCTIONS:
      1. **Version 1 (contentNative)**: Write the article in **ENGLISH** (or the native language of ${country} if not Global). IT MUST BE THE FIRST VERSION.
      2. **Version 2 (contentPt)**: Write the article in **PORTUGUESE (Brazil)**.
      3. **SEO Metadata**: Create optimized Title, Meta Description, AND a URL Slug (handle) for both versions.
      
      FORMATTING:
      - Use standard Markdown.
      - **Substack Style**: Catchy H1, Subtitle, short punchy paragraphs, high engagement.
      - **Images**: Insert 2 Pollinations.ai images in Markdown format:
        ![${keyword} Commercial](https://image.pollinations.ai/prompt/commercial%20shot%20of%20${keyword}?nologo=true)
        ![${keyword} Benefits](https://image.pollinations.ai/prompt/${keyword}%20benefits%20lifestyle?nologo=true)
      
      MANDATORY:
      - **Anti-Counterfeit Warning**: You MUST include a dedicated section warning users about fake products and emphasizing the importance of buying from the official site.
      - **CTAs**: You MUST insert exactly 3 Call-To-Action (CTA) placeholders in the text (Beginning, Middle, End) using this EXACT format:
        > **🎯 CLIQUE AQUI:** [Persuasive text to buy ${keyword} now]
      
      CRITICAL:
      - Ensure BOTH versions are complete. Do not cut off the text.
      - Make it emotional and persuasive.
      - The 'contentNative' field MUST contain the full English article (at least 800 words, with introduction, body, and conclusion). Do not truncate it.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: articleSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No article data received");
    
    return JSON.parse(text) as GeneratedArticle;
  } catch (error) {
    console.error("Error generating article:", error);
    throw new Error("Falha na geração do conteúdo");
  }
};
