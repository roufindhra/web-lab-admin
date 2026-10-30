import React from "react";

interface FooterProps {
  companyName: string;
}

const Footer: React.FC<FooterProps> = ({ companyName }: FooterProps) => {
  return (
    <footer className="w-full border-t border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface) px-6 py-4 text-center transition-colors">
      <p className="text-xs font-medium text-(--md-sys-color-on-surface) opacity-70">
        &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
