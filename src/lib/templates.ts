import { ResumeTemplateId, ResumeTemplateOption } from '../types';

export const RESUME_TEMPLATES: ResumeTemplateOption[] = [
  {
    id: 'ats-classic',
    name: 'ATS Classic',
    description: 'Minimal, traditional single-column layout with serif typography and standard dividers. Maximum machine readability for traditional corporate ATS software.',
    targetRoles: 'Corporate, Finance, Legal, Business Operations',
    badge: '100% ATS Classic'
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Crisp sans-serif typography, left-aligned header, and distinct section borders for strong visual hierarchy while remaining 100% single-column ATS compliant.',
    targetRoles: 'Management, Product, Marketing, Consulting',
    badge: 'Executive & Clean'
  },
  {
    id: 'technical',
    name: 'Compact Technical',
    description: 'Engineered for software engineers, data, DevOps, and IT. Prominently surfaces technical skills and project tech stacks right upfront.',
    targetRoles: 'Software Engineering, Data Science, DevOps, Cloud & IT',
    badge: 'Tech Stack Focused'
  },
  {
    id: 'resumematch-professional',
    name: 'ResumeMatch Professional',
    description: 'Clean, professional text-first resume layout with a strong typographic hierarchy. Tailored for software engineers and modern technical roles.',
    targetRoles: 'Software Engineering, Technical Roles',
    badge: 'Professional & Clean'
  }
];

export function getTemplateOption(id?: ResumeTemplateId): ResumeTemplateOption {
  return RESUME_TEMPLATES.find(t => t.id === id) || RESUME_TEMPLATES[0];
}
