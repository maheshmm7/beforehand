import { todayIso } from '@/lib/format';
import { useWorkspace } from '@/state/useWorkspace';
import { Closing } from './landing/Closing';
import { Comparison } from './landing/Comparison';
import { EventTypes } from './landing/EventTypes';
import { Features } from './landing/Features';
import { Hero } from './landing/Hero';
import { HowItWorks } from './landing/HowItWorks';
import { Questions } from './landing/Questions';
import { YourPlans } from './landing/YourPlans';

/**
 * The landing page is the order of its sections and nothing else. Each one
 * owns its own markup, and what they all say lives in `landing/content.tsx`.
 */
export function HomePage(): React.JSX.Element {
  const { workspace } = useWorkspace();

  return (
    <>
      <Hero />
      <YourPlans plans={workspace.plans} today={todayIso()} />
      <HowItWorks />
      <Comparison />
      <Features />
      <EventTypes />
      <Questions />
      <Closing />
    </>
  );
}
