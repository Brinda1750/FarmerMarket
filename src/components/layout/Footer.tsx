import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, MapPin, Phone, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-primary rounded-full p-2">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">FarmerMarket</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Fresh, organic produce directly from local farmers to your doorstep.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-muted-foreground hover:text-primary" to="/">Home</Link></li>
            <li><Link className="text-muted-foreground hover:text-primary" to="/products">Products</Link></li>
            <li><Link className="text-muted-foreground hover:text-primary" to="/stores">Stores</Link></li>
            <li><Link className="text-muted-foreground hover:text-primary" to="/about">About</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> 22it150@charusat.edu.in</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 97232-75264</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Surat, Gujarat, India</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Follow Us</h4>
          <div className="flex items-center gap-3">
            <a className="p-2 rounded-full border hover:bg-muted" href="#" aria-label="Facebook"><Facebook className="w-4 h-4" /></a>
            <a className="p-2 rounded-full border hover:bg-muted" href="#" aria-label="Instagram"><Instagram className="w-4 h-4" /></a>
            <a className="p-2 rounded-full border hover:bg-muted" href="#" aria-label="Twitter"><Twitter className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} FarmerMarket. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="#" className="hover:text-primary">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


