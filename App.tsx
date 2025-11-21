import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RotateCcw, Loader2, AlertCircle, MoveRight, Zap } from 'lucide-react';
import FileUpload from './components/FileUpload';
import { generateMarketingAsset, analyzeProductImage } from './services/geminiService';
import { AssetRequest, LoadingState } from './types';

const App: React.FC = () => {
  // State
  const [request, setRequest] = useState<AssetRequest>({
    productImage: null,
    modelImage: null,
    modelDescription: '',
    scenario: '',
  });
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Auto-scroll to results on mobile
  useEffect(() => {
    if (generatedImage || loadingState === LoadingState.GENERATING) {
        const resultSection = document.getElementById('result-section');
        if (resultSection && window.innerWidth < 1024) {
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
  }, [generatedImage, loadingState]);

  // Handlers
  const handleProductUpload = async (file: File | null) => {
    setRequest(prev => ({ ...prev, productImage: file }));
    
    if (file) {
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeProductImage(file);
        setRequest(prev => ({
          ...prev,
          modelDescription: analysis.modelDescription,
          scenario: analysis.scenario
        }));
      } catch (error) {
        console.error("Analysis failed", error);
        // Fail silently on UI to maintain minimalist look, manual input remains
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleGenerate = async () => {
    if (!request.productImage) {
      setErrorMessage("MISSING PRODUCT IMAGE");
      return;
    }
    if (!request.modelDescription.trim()) {
      setErrorMessage("MISSING MODEL DESCRIPTION");
      return;
    }

    setLoadingState(LoadingState.GENERATING);
    setErrorMessage(null);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateMarketingAsset(
        request.productImage,
        request.modelDescription,
        request.scenario,
        request.modelImage
      );
      setGeneratedImage(imageUrl);
      setLoadingState(LoadingState.SUCCESS);
    } catch (error: any) {
      setLoadingState(LoadingState.ERROR);
      setErrorMessage(error.message || "GENERATION FAILED");
    }
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setLoadingState(LoadingState.IDLE);
    setErrorMessage(null);
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `RETAIL_ASSET_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white text-black font-mono selection:bg-black selection:text-white">
      
      {/* LEFT PANEL: CONTROLS */}
      <div className="w-full lg:w-[480px] border-b lg:border-b-0 lg:border-r border-black flex flex-col flex-shrink-0 z-20 bg-white h-auto lg:h-screen overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <header className="p-6 lg:p-8 border-b border-black sticky top-0 bg-white z-30">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight leading-none">
            RetailGen<span className="text-4xl text-black">.</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] mt-2 text-gray-500">
            Automated Editorial Asset Generator
          </p>
        </header>

        {/* Form */}
        <div className="p-6 lg:p-8 space-y-10 flex-grow">
          
          {/* Step 1 */}
          <div className="space-y-4">
            <FileUpload
              stepPrefix="01 /"
              label="SOURCE PRODUCT"
              subLabel="PNG/JPG"
              file={request.productImage}
              onFileChange={handleProductUpload}
              required
            />
          </div>

          {/* Step 2 */}
          <div className="space-y-4 relative">
            <div className="flex justify-between items-end">
                <label className="block text-xs uppercase tracking-[0.15em] font-bold">
                  <span className="mr-2 opacity-50">02 /</span>
                  Model Specs <span className="text-black">*</span>
                </label>
                {isAnalyzing && (
                   <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest animate-pulse">
                      <Zap size={12} fill="black" />
                      <span>Auto-analyzing</span>
                   </div>
                )}
            </div>
            
            <textarea
              rows={4}
              disabled={isAnalyzing}
              className={`w-full bg-transparent border border-black p-4 text-sm font-serif placeholder:font-mono focus:outline-none focus:ring-1 focus:ring-black transition-all rounded-none resize-none
                ${isAnalyzing ? 'opacity-50' : 'opacity-100'}
              `}
              placeholder={isAnalyzing ? "READING IMAGE DATA..." : "Detailed description of model, ethnicity, age, styling..."}
              value={request.modelDescription}
              onChange={(e) => setRequest(prev => ({ ...prev, modelDescription: e.target.value }))}
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
             <FileUpload
              stepPrefix="03 /"
              label="Model Reference"
              subLabel="OPTIONAL"
              file={request.modelImage}
              onFileChange={(file) => setRequest(prev => ({ ...prev, modelImage: file }))}
            />
          </div>

          {/* Step 4 */}
          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-[0.15em] font-bold">
              <span className="mr-2 opacity-50">04 /</span>
              Context
            </label>
            <input
              type="text"
              className="w-full bg-transparent border border-black p-4 text-sm font-serif placeholder:font-mono focus:outline-none focus:ring-1 focus:ring-black rounded-none"
              placeholder="e.g. High-end studio, City streets..."
              value={request.scenario}
              onChange={(e) => setRequest(prev => ({ ...prev, scenario: e.target.value }))}
            />
          </div>

          {/* Error Display */}
          {errorMessage && (
            <div className="border border-red-600 bg-red-50 p-4 flex items-start gap-3 text-red-600 text-xs font-bold uppercase tracking-wide">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer / Action */}
        <div className="p-6 lg:p-8 border-t border-black bg-white sticky bottom-0 z-30">
          <button
            onClick={handleGenerate}
            disabled={loadingState === LoadingState.GENERATING || isAnalyzing}
            className={`
              w-full h-14 flex items-center justify-between px-6 uppercase tracking-[0.2em] text-xs font-bold transition-all border border-black
              ${loadingState === LoadingState.GENERATING 
                ? 'bg-gray-100 text-gray-400 cursor-wait' 
                : 'bg-black text-white hover:bg-white hover:text-black'}
            `}
          >
            <span>{loadingState === LoadingState.GENERATING ? 'Processing' : 'Execute Generation'}</span>
            {loadingState === LoadingState.GENERATING ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MoveRight size={16} />
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div id="result-section" className="flex-1 bg-[#f8f8f8] relative min-h-[50vh] lg:min-h-screen flex flex-col">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" 
             style={{ 
                 backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                 backgroundSize: '40px 40px' 
             }}>
        </div>

        {/* Top Info Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none mix-blend-difference text-white lg:text-black lg:mix-blend-normal">
            <div className="text-[10px] uppercase tracking-widest font-bold hidden lg:block">
               Preview Mode <br/>
               Scale: 100%
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-right hidden lg:block">
               {new Date().toLocaleDateString()} <br/>
               Gemini 2.5 Core
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-8 z-10">
          
          {/* Empty State */}
          {loadingState === LoadingState.IDLE && !generatedImage && (
             <div className="text-center max-w-md opacity-20 pointer-events-none select-none">
                <h2 className="font-serif text-6xl lg:text-8xl leading-[0.8] mb-4">
                   Retail<br/>Asset<br/>Maker
                </h2>
                <p className="font-mono text-xs uppercase tracking-widest border-t border-black pt-4 mt-4 inline-block w-full">
                   Waiting for input
                </p>
             </div>
          )}

          {/* Loading State */}
          {loadingState === LoadingState.GENERATING && (
            <div className="flex flex-col items-center gap-6">
               <div className="w-24 h-24 border border-black flex items-center justify-center animate-pulse bg-white">
                  <Sparkles size={32} strokeWidth={1} />
               </div>
               <div className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse">
                  Rendering Scene...
               </div>
            </div>
          )}

          {/* Result State */}
          {generatedImage && (
            <div className="relative w-full max-w-2xl group">
              <div className="border border-black bg-white p-2 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                <img 
                  src={generatedImage} 
                  alt="Generated Asset" 
                  className="w-full h-auto block"
                />
              </div>
              
              {/* Floating Actions */}
              <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={handleDownload}
                    className="bg-black text-white px-6 py-3 uppercase text-xs tracking-widest font-bold hover:bg-white hover:text-black border border-black transition-colors flex items-center gap-2"
                >
                    <Download size={14} /> Download
                </button>
                <button
                    onClick={handleReset}
                    className="bg-white text-black px-4 py-3 uppercase text-xs tracking-widest font-bold hover:bg-black hover:text-white border border-black transition-colors"
                >
                    <RotateCcw size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Metadata (Visible only when image exists) */}
        {generatedImage && (
            <div className="p-4 border-t border-black bg-white flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                <span className="truncate max-w-[300px]">SOURCE: {request.productImage?.name}</span>
                <span>GEN_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;