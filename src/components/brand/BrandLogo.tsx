type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({
  className = "h-8 max-w-[180px]",
}: BrandLogoProps) {
  return (
    <span
      role="img"
      aria-label="OlioCMS"
      className={`inline-block aspect-[2/1] bg-contain bg-no-repeat bg-center bg-[url('/logos/oliocms_logo_light.png')] dark:bg-[url('/logos/oliocms_logo_dark.png')] ${className}`}
    />
  );
}
