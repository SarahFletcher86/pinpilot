import React, { useRef } from 'react';
import { Template } from '../types';
import { LayoutTemplateIcon, TypeIcon, PaletteIcon, BrandingIcon } from './Icons';

interface BrandingControlsProps {
    template: Template;
    onTemplateChange: (template: Template) => void;
    text: string;
    onTextChange: (text: string) => void;
    colors: { text: string; accent: string };
    onColorChange: (colors: { text: string; accent: string }) => void;
    font: string;
    onFontChange: (font: string) => void;
    logo: string | null;
    onLogoUpload: (logo: string | null) => void;
}

const FONTS = ['Poppins', 'Montserrat', 'Lato', 'Playfair Display', 'Oswald'];
const TEMPLATES: { id: Template; name: string }[] = [
    { id: 'standard', name: 'Standard' },
    { id: 'text-overlay', name: 'Text Overlay' },
    { id: 'bottom-bar', name: 'Bottom Bar' },
];

const BrandingControls: React.FC<BrandingControlsProps> = (props) => {
    const { 
        template, onTemplateChange, 
        text, onTextChange, 
        colors, onColorChange, 
        font, onFontChange, 
        logo, onLogoUpload 
    } = props;
    
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onLogoUpload(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        if(event.target) event.target.value = '';
    };

    return (
        <div className="border-t pt-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center"><span className="bg-slate-800 text-white rounded-full h-6 w-6 text-sm flex items-center justify-center mr-3">2</span>Design & Brand</h3>
            
            {/* Template Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center"><LayoutTemplateIcon className="w-4 h-4 mr-2"/> Template</label>
                <div className="grid grid-cols-3 gap-2">
                    {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => onTemplateChange(t.id)} className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${template === t.id ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>{t.name}</button>
                    ))}
                </div>
            </div>

            {/* Text Overlay Input */}
            <div>
                <label htmlFor="overlay-text" className="block text-sm font-medium text-slate-700 mb-2 flex items-center"><TypeIcon className="w-4 h-4 mr-2"/> Overlay Text</label>
                <input 
                    id="overlay-text"
                    type="text" 
                    value={text} 
                    onChange={e => onTextChange(e.target.value)} 
                    className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500"
                    placeholder="Your Catchy Title"
                />
            </div>
            
            {/* Color Pickers */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center"><PaletteIcon className="w-4 h-4 mr-2"/> Brand Colors</label>
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <label htmlFor="text-color" className="block text-xs text-slate-500">Text</label>
                        <input id="text-color" type="color" value={colors.text} onChange={e => onColorChange({ ...colors, text: e.target.value })} className="w-full h-10 p-1 border-none rounded-md bg-transparent cursor-pointer" />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="accent-color" className="block text-xs text-slate-500">Accent</label>
                        <input id="accent-color" type="color" value={colors.accent} onChange={e => onColorChange({ ...colors, accent: e.target.value })} className="w-full h-10 p-1 border-none rounded-md bg-transparent cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* Font & Logo */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="font-select" className="block text-sm font-medium text-slate-700 mb-2 flex items-center"><TypeIcon className="w-4 h-4 mr-2"/> Font</label>
                    <select id="font-select" value={font} onChange={e => onFontChange(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500">
                        {FONTS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
                    </select>
                </div>
                <div>
                     <label htmlFor="logo-upload" className="block text-sm font-medium text-slate-700 mb-2 flex items-center"><BrandingIcon className="w-4 h-4 mr-2"/> Logo</label>
                     {logo ? (
                        <div className="flex items-center space-x-2">
                            <img src={logo} alt="Logo Preview" className="w-10 h-10 rounded-md object-contain bg-slate-100 p-1 border border-slate-200" />
                            <button onClick={() => onLogoUpload(null)} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm text-slate-700 bg-white hover:bg-slate-50 text-sm">Remove</button>
                        </div>
                     ) : (
                        <button onClick={() => logoInputRef.current?.click()} className="w-full p-2 border border-slate-300 rounded-lg shadow-sm text-slate-700 bg-white hover:bg-slate-50 text-sm">Upload Logo</button>
                     )}
                     <input type="file" accept="image/png, image/jpeg" ref={logoInputRef} onChange={handleLogoChange} className="hidden" />
                </div>
            </div>
        </div>
    );
};

export default BrandingControls;
