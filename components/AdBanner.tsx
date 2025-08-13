import React from 'react';

const AdBanner: React.FC = () => {
  return (
    <div className="mt-6 pt-6 border-t border-slate-200 animate-fade-in">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sponsored</h4>
      <a 
        href="#" // Replace with your affiliate link or keep for AdSense
        target="_blank" 
        rel="noopener noreferrer" 
        className="block bg-slate-50 p-4 rounded-lg hover:bg-slate-100 transition-colors text-center"
      >
        {/* 
          This is where you can place your monetization code.
          - For AdSense: Paste your ad unit code here.
          - For Affiliate Links: You can design a banner with an image and text.
        */}
        <div className="flex flex-col items-center justify-center h-24">
            <p className="font-semibold text-slate-700">Your Ad Placeholder</p>
            <p className="text-sm text-slate-500 mt-1">Embed your AdSense or affiliate banner here.</p>
        </div>
      </a>
    </div>
  );
};

export default AdBanner;
