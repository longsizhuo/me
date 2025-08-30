export interface FeedbackCardProps {
  index: number;
  testimonial: string;
  name: string;
  designation: string;
  company: string;
  image: string;
}

export interface ProjectOverlayProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  title?: string;
  description?: string;
  photos?: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export interface ProjectCardProps {
  index: number;
  name: string;
  description: string;
  tags: { name: string; color: string }[];
  image: string;
  onClick: () => void;
}

export interface ServiceCardProps {
  index: number;
  title: string;
  icon: string;
  description: string;
  stars?: number;
  forks?: number;
}

export interface LazyImageProps {
  loader: string;
  alt: string;
  gap: string;
}

export interface ExperienceCardProps {
  experience: {
    title: string;
    company_name: string;
    icon: string;
    iconBg: string;
    date: string;
    points: string[];
  };
}

export interface EducationCardProps {
  degree: string;
  university: string;
  duration: string;
  coursework: string;
  index: number;
}

export interface PhotoGalleryDialogProps {
  title?: string;
  buttonText?: string;
  photos?: Array<string | { src: string; alt?: string; caption?: string; subtitle?: string }>;
  description?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}
