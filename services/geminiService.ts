
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
    currencySymbol: { type: Type.STRING, description: "Currency symbol for the country (e.g., R$, $, €, £)" },
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
          volume: { type: Type.INTEGER, description: "Relative interest score (0-100) or volume" },
        },
        required: ["name", "volume"],
      },
    },
    relatedTerms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "Related keyword" },
          searchVolume: { type: Type.INTEGER, description: "Monthly search volume estimate for this term" }
        },
        required: ["term", "searchVolume"]
      },
    },
    articleTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "10 Clickbait/Viral titles for articles in Portuguese"
    },
    affiliateAnalysis: {
      type: Type.OBJECT,
      properties: {
        viabilityScore: { type: Type.INTEGER, description: "0 to 100 score for affiliate marketing viability" },
        difficultyLevel: { type: Type.STRING, enum: ["Baixa", "Média", "Alta"] },
        verdictPt: { type: Type.STRING, description: "Detailed paragraph analyzing viability in Portuguese (PT-BR)" },
        verdictNative: { type: Type.STRING, description: "Detailed paragraph analyzing viability in the target country's native language" },
        lowCostStrategies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              titlePt: { type: Type.STRING, description: "Strategy title in Portuguese" },
              titleNative: { type: Type.STRING, description: "Strategy title in target country language" },
              descriptionPt: { type: Type.STRING, description: "Strategy details in Portuguese" },
              descriptionNative: { type: Type.STRING, description: "Strategy details in target country language" }
            },
            required: ["titlePt", "titleNative", "descriptionPt", "descriptionNative"]
          }
        }
      },
      required: ["viabilityScore", "difficultyLevel", "verdictPt", "verdictNative", "lowCostStrategies"]
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
    "articleTitles",
    "insightSummary",
    "affiliateAnalysis"
  ],
};

const articleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    seoTitlePt: { type: Type.STRING, description: "Optimized SEO Title in Portuguese (Brazil)" },
    seoSubtitlePt: { type: Type.STRING, description: "Optimized Meta Description in Portuguese (Brazil)" },
    seoTitleNative: { type: Type.STRING, description: "Optimized SEO Title in the target country's native language" },
    seoSubtitleNative: { type: Type.STRING, description: "Optimized Meta Description in the target country's native language" },
    contentPt: { type: Type.STRING, description: "The complete blog article written in Portuguese (Brazil)." },
    contentSecondLanguage: { type: Type.STRING, description: "The complete blog article written in the target country's native language (if different from PT)." }
  },
  required: ["seoTitlePt", "seoSubtitlePt", "seoTitleNative", "seoSubtitleNative", "contentPt", "contentSecondLanguage"]
};

export const fetchSEOAnalysis = async (keyword: string, country: string): Promise<SEOAnalysis> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the search trends for the keyword or product: "${keyword}" focusing on the country: "${country}". 
      
      IMPORTANT RULES:
      1. Provide estimated data for the last 6 months based on real search behavior in ${country}.
      2. Currency must be the local currency of ${country}.
      3. Top Regions must be cities/states inside ${country}.
      4. Related terms must include the search volume.
      5. ALL textual explanations (insightSummary, articleTitles) MUST be in PORTUGUESE (PT-BR).
      
      For the Affiliate Analysis:
      - Evaluate if it's viable to sell this as an affiliate.
      - Suggest LOW COST strategies (organic traffic, social media, etc).
      - Be realistic about competition.
      - **CRITICAL**: Provide the verdict and strategy descriptions in BOTH Portuguese (PT-BR) AND the Native Language of ${country}.
      
      6. The 'relatedTerms' keywords themselves should be in the language spoken in ${country}, but if appropriate, include variations.
      7. 'articleTitles' must be in Portuguese, optimized for high CTR.`,
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
      country,
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
      contents: `You are a world-class SEO and SXO (Search Experience Optimization) copywriter.
      
      Task: Write a complete, humanized blog article based on the title: "${title}".
      Focus Keyword: "${keyword}".
      Target Country Market: "${country}".
      Secondary Keywords to include naturally: ${termsString}.

      CRITICAL INSTRUCTIONS:
      1. You MUST generate TWO versions of the article.
      2. **Version 1 (contentPt)**: Written in Portuguese (Brazil).
      3. **Version 2 (contentSecondLanguage)**: Written in the native language of "${country}". (If the country is Brazil, you can leave this string empty or write a variation).
      4. **Structure**: Both articles must use standard Markdown (H1, H2, H3, Bold, Bullet points).
      5. **Substack Format**: The content must be ready to copy and paste into Substack. Start with a catchy Headline (H1) and a Subtitle.
      6. **SEO**: Create separate optimized 'seoTitle' and 'seoSubtitle' for BOTH languages (Portuguese and the Target Country Language).
      7. **IMAGES**: You MUST include 2 images in the markdown content using the following syntax:
         ![Commercial Image of ${keyword}](https://image.pollinations.ai/prompt/${keyword}%20commercial%20product%20shot%20professional%20lighting?nologo=true)
         ![Benefits of ${keyword}](https://image.pollinations.ai/prompt/${keyword}%20benefits%20demonstration%20lifestyle?nologo=true)
         Place the Commercial Image near the top, and the Benefits Image in the middle of the article.

      Make the content engaging, storytelling-driven, and highly readable. Avoid generic AI tone.
      `,
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
