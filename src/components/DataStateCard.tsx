import { Link } from "react-router-dom";

type DataStateCardProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
  className?: string;
};

const DataStateCard = ({ title, description, ctaLabel, ctaTo, className = "" }: DataStateCardProps) => (
  <div className={`rounded-2xl border border-border/60 bg-card/50 p-10 text-center ${className}`}>
    <p className="font-heading text-xl text-foreground">{title}</p>
    <p className="font-body text-muted-foreground mt-2">{description}</p>
    {ctaLabel && ctaTo ? (
      <Link to={ctaTo} className="inline-flex mt-6 font-body text-sm bg-foreground text-background px-6 py-3 rounded-full">
        {ctaLabel}
      </Link>
    ) : null}
  </div>
);

export default DataStateCard;
