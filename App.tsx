
import React, { useState, useCallback } from 'react';
import { Search, TrendingUp, Map, Hash, FileText, Sparkles, ArrowRight, Loader2, DollarSign, MousePointerClick, Globe, ArrowLeft, Briefcase, CheckCircle2, AlertTriangle, Lightbulb, Copy, Check } from 'lucide-react';
import { fetchSEOAnalysis, generateBlogPost } from './services/geminiService';
import { SEOAnalysis, LoadingState, GeneratedArticle } from './types';
import TrendChart from './components/TrendChart';
import RegionList from './components/RegionList';

const COUNTRIES = ['Brasil', 'Estados Unidos', 'Canadá', 'Alemanha', 'Itália', 'Espanha', 'Reino Unido'];

// Helper component for rendering Markdown content
const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let inList = false;

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${keyPrefix}`} className="list-disc pl-6 space-y-2 mb-6 text-slate-700">
          {...currentList}
        </ul>
      );
      currentList = [];
    }
    inList = false;
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines unless they separate blocks (handled by spacing classes)
    if (!trimmedLine) {
      if (inList) flushList(index);
      return;
    }

    // Headers
    if (trimmedLine.startsWith('# ')) {
      if (inList) flushList(index);
      elements.push(<h1 key={index} className="text-3xl md:text-4xl font-bold text-slate-900 mt-10 mb-6 leading-tight">{parseBold(trimmedLine.slice(2))}</h1>);
    } else if (trimmedLine.startsWith('## ')) {
      if (inList) flushList(index);
      elements.push(<h2 key={index} className="text-2xl md:text-3xl font-bold text-slate-800 mt-8 mb-4 leading-snug">{parseBold(trimmedLine.slice(3))}</h2>);
    } else if (trimmedLine.startsWith('### ')) {
      if (inList) flushList(index);
      elements.push(<h3 key={index} className="text-xl md:text-2xl font-bold text-slate-800 mt-6 mb-3">{parseBold(trimmedLine.slice(4))}</h3>);
    }
    // Lists
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      inList = true;
      currentList.push(<li key={`item-${index}`} className="pl-1 leading-relaxed">{parseBold(trimmedLine.replace(/^[-*]\s+/, ''))}</li>);
    } 
    // Paragraphs
    else {
      if (inList) flushList(index);
      elements.push(<p key={index} className="text-slate-700 leading-relaxed mb-5 text-lg">{parseBold(trimmedLine)}</p>);
    }
  });

  if (inList) flushList(lines.length);

  return <div className="font-serif max-w-none">{elements}</div>;
};

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Brasil');
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Article Generation State
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [currentArticleTitle, setCurrentArticleTitle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setLoadingState(LoadingState.LOADING);
    setError(null);
    setAnalysis(null);
    setGeneratedArticle(null);

    try {
      const data = await fetchSEOAnalysis(keyword, selectedCountry);
      setAnalysis(data);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      setError("Ocorreu um erro ao analisar os dados. Tente novamente.");
      setLoadingState(LoadingState.ERROR);
    }
  }, [keyword, selectedCountry]);

  const handleGenerateArticle = async (title: string) => {
    if (!analysis) return;
    
    setLoadingState(LoadingState.GENERATING_ARTICLE);
    setCurrentArticleTitle(title);
    
    try {
      const articleData = await generateBlogPost(title, analysis.keyword, analysis.country, analysis.relatedTerms);
      setGeneratedArticle(articleData);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      setError("Erro ao gerar o artigo. Tente novamente.");
      setLoadingState(LoadingState.SUCCESS); // Return to dashboard view but showing error
    }
  };

  const closeArticle = () => {
    setGeneratedArticle(null);
    setCurrentArticleTitle(null);
    setCopied(false);
  };

  const copyToClipboard = (article: GeneratedArticle) => {
    let textToCopy = `--- VERSÃO EM PORTUGUÊS ---\n\n${article.contentPt}`;
    if (article.contentSecondLanguage) {
      textToCopy += `\n\n\n--- VERSÃO NATIVA (${analysis?.country || 'Local'}) ---\n\n${article.contentSecondLanguage}`;
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderAffiliateSection = (analysis: SEOAnalysis) => {
    const { affiliateAnalysis } = analysis;
    const isViable = affiliateAnalysis.viabilityScore >= 60;
    const circumference = 2 * Math.PI * 56;

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-1 lg:col-span-3">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Análise de Afiliação & Vendas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Score Card */}
          <div className="bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-center border border-slate-200">
            <div className="relative flex items-center justify-center w-32 h-32 mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-200" />
                <circle 
                  cx="64" cy="64" r="56" 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  fill="transparent" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={circumference - (circumference * affiliateAnalysis.viabilityScore) / 100}
                  className={`${isViable ? 'text-green-500' : 'text-amber-500'} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{affiliateAnalysis.viabilityScore}</span>
                <span className="text-xs font-medium text-slate-500">VIABILIDADE</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Dificuldade:</span>
              <span className={`px-2 py-0.5 rounded-full ${
                affiliateAnalysis.difficultyLevel === 'Alta' ? 'bg-red-100 text-red-700' :
                affiliateAnalysis.difficultyLevel === 'Média' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {affiliateAnalysis.difficultyLevel}
              </span>
            </div>
          </div>

          {/* Verdict & Strategies */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                {isViable ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                Veredito da IA
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                {affiliateAnalysis.verdict}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-brand-500" />
                Estratégias de Baixo Custo Recomendadas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {affiliateAnalysis.lowCostStrategies.map((strategy, idx) => (
                  <div key={idx} className="bg-brand-50/50 p-4 rounded-lg border border-brand-100">
                    <h4 className="font-bold text-brand-700 text-sm mb-1">{strategy.title}</h4>
                    <p className="text-xs text-slate-600">{strategy.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // View: Generated Article
  if (generatedArticle && currentArticleTitle) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
             <button 
                onClick={closeArticle}
                className="flex items-center gap-2 text-slate-600 hover:text-brand-600 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar ao Dashboard
              </button>
              <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-400 hidden sm:block">Gerador de Conteúdo SEO</span>
                 <button 
                   onClick={() => copyToClipboard(generatedArticle)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${copied ? 'bg-green-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                 >
                   {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   {copied ? 'Copiado!' : 'Copiar Tudo'}
                 </button>
              </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
          
          {/* SEO Metadata Card */}
          <div className="bg-slate-800 text-slate-100 rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Search className="w-4 h-4 text-brand-400" />
                 <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Metadados para Indexação (SEO)</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">SEO Title</p>
                <p className="font-medium text-lg text-white">{generatedArticle.seoTitle}</p>
              </div>
              <div className="w-full h-px bg-slate-700"></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Meta Description / Subtitle</p>
                <p className="text-slate-300 leading-relaxed">{generatedArticle.seoSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Article Body - Portuguese */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-8 py-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <FileText className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" />
                  <span>Versão Português</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight max-w-2xl">
                  {currentArticleTitle}
                </h1>
              </div>
            </div>
            
            <div className="p-8 md:p-12">
              <SimpleMarkdownRenderer content={generatedArticle.contentPt} />
            </div>
          </div>

          {/* Article Body - Second Language */}
          {generatedArticle.contentSecondLanguage && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-brand-400" />
                  <h2 className="text-xl font-bold">Versão Internacional ({analysis?.country})</h2>
                </div>
              </div>
              <div className="p-8 md:p-12">
                <SimpleMarkdownRenderer content={generatedArticle.contentSecondLanguage} />
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // View: Main Dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Overlay Loading for Article Generation */}
      {loadingState === LoadingState.GENERATING_ARTICLE && (
        <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center max-w-md text-center animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Escrevendo seus artigos...</h3>
            <p className="text-slate-600">
              A IA está criando conteúdos bilingues otimizados para SEO sobre <span className="font-semibold text-brand-600">"{currentArticleTitle}"</span>.
            </p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 p-1.5 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600">
              TrendScope AI
            </span>
          </div>
          <a 
            href="#" 
            className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
          >
            Sobre
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero / Search Section */}
        <div className={`transition-all duration-500 ease-in-out ${analysis ? 'mb-8' : 'min-h-[60vh] flex flex-col justify-center items-center text-center'}`}>
          {!analysis && (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6 animate-fade-in-up">
                <Sparkles className="w-4 h-4" />
                <span>Powered by Gemini 2.5 Flash</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-3xl">
                Descubra tendências de mercado <span className="text-brand-500">instantaneamente</span>.
              </h1>
              <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
                Insira um produto ou palavra-chave para visualizar volumes de pesquisa, interesse regional, viabilidade de afiliação e ideias de conteúdo viral.
              </p>
            </>
          )}

          <div className="w-full max-w-2xl space-y-4">
            {/* Country Selection */}
            <div className={`flex flex-wrap justify-center gap-2 ${!analysis ? 'mb-6' : 'justify-start'}`}>
               {!analysis && <p className="w-full text-sm text-slate-400 font-medium mb-2 text-center uppercase tracking-wide">Selecione o mercado alvo</p>}
               {COUNTRIES.map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  type="button"
                  disabled={loadingState === LoadingState.LOADING || loadingState === LoadingState.GENERATING_ARTICLE}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    selectedCountry === country
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 ${loadingState === LoadingState.LOADING ? 'text-brand-500' : 'text-slate-400'}`} />
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={`Pesquisar tendências no ${selectedCountry}...`}
                className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-lg placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm group-hover:shadow-md"
                disabled={loadingState === LoadingState.LOADING || loadingState === LoadingState.GENERATING_ARTICLE}
              />
              <button
                type="submit"
                disabled={loadingState === LoadingState.LOADING || loadingState === LoadingState.GENERATING_ARTICLE || !keyword.trim()}
                className="absolute right-2 top-2 bottom-2 bg-brand-600 hover:bg-brand-700 text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingState === LoadingState.LOADING ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Analisar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 animate-fade-in text-center">
              {error}
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        {analysis && loadingState === LoadingState.SUCCESS && !generatedArticle && (
          <div className="space-y-6 animate-fade-in-up">
            
            <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm">
              <Globe className="w-4 h-4" />
              <span>Resultados para <strong>{analysis.keyword}</strong> no <strong>{analysis.country}</strong></span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Volume Total (6 Meses)</h3>
                </div>
                <p className="text-3xl font-bold text-slate-900">{analysis.totalVolumeLast6Months.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1">Pesquisas estimadas</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Média Mensal</h3>
                </div>
                <p className="text-3xl font-bold text-slate-900">{analysis.averageMonthlyVolume.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1">Pesquisas / mês</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Insight IA</h3>
                </div>
                <p className="text-md font-medium text-slate-700 leading-relaxed">
                  "{analysis.insightSummary}"
                </p>
              </div>
            </div>

            {/* CPC Estimates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 p-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Google Ads CPC</h3>
                </div>
                <div className="relative z-10">
                  <p className="text-2xl font-bold text-slate-900">{analysis.currencySymbol} {analysis.cpcGoogle.toFixed(2)}</p>
                  <p className="text-sm text-slate-500 mt-1">Custo estimado por clique</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 p-24 bg-sky-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                    <MousePointerClick className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Meta Ads CPC</h3>
                </div>
                <div className="relative z-10">
                  <p className="text-2xl font-bold text-slate-900">{analysis.currencySymbol} {analysis.cpcMeta.toFixed(2)}</p>
                  <p className="text-sm text-slate-500 mt-1">Custo estimado por clique</p>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                Tendência de Pesquisa
              </h2>
              <TrendChart data={analysis.trendPoints} />
            </div>

            {/* Affiliate Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {renderAffiliateSection(analysis)}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Top Regions */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Map className="w-5 h-5 text-brand-500" />
                  Top Regiões
                </h2>
                <RegionList regions={analysis.topRegions} />
              </div>

              {/* Related Terms (Updated with Volumes) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-brand-500" />
                  Termos Relacionados
                </h2>
                <div className="space-y-3">
                  {analysis.relatedTerms.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                      <span className="text-slate-700 font-medium text-sm group-hover:text-brand-600">{item.term}</span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-mono group-hover:bg-white group-hover:shadow-sm">
                        {item.searchVolume.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Article Ideas (Clickable) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" />
                  Gerador de Conteúdo
                </h2>
                <p className="text-xs text-slate-500 mb-4">Clique em um título para gerar um artigo SEO bilingue completo.</p>
                <ul className="space-y-3">
                  {analysis.articleTitles.map((title, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => handleGenerateArticle(title)}
                      className="flex items-start gap-3 group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                    >
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-brand-50 text-brand-600 text-xs font-bold rounded-full group-hover:bg-brand-600 group-hover:text-white transition-colors mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-600 group-hover:text-brand-700 font-medium leading-snug transition-colors">
                        {title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
