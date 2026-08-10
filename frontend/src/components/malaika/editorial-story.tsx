'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fadeUp, motionProps } from '@/lib/motion';

interface EditorialStoryProps {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  reverse?: boolean;
}

/**
 * Full-bleed editorial story block — used between product sections on the home
 * page (and other landing pages) to add editorial pacing and brand storytelling.
 * Inverted (ink background, paper text) so it visually breaks up the page.
 *
 * The `reverse` prop flips the image to the right side on desktop by using
 * CSS `direction: rtl` on the grid (which respects DOM order). The image and
 * text children reset back to `ltr` so their internal layout is unaffected.
 */
export function EditorialStory({ image, eyebrow, title, body, cta, reverse }: EditorialStoryProps) {
  return (
    <section className="py-16 lg:py-24 bg-ink text-paper">
      <div className="container-bleed">
        <div
          className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
            reverse ? 'lg:[direction:rtl]' : ''
          }`}
        >
          <motion.div
            {...motionProps(fadeUp)}
            className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden [direction:ltr]"
          >
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
          <motion.div {...motionProps(fadeUp)} className="[direction:ltr]">
            <p className="eyebrow text-paper/60 mb-4">{eyebrow}</p>
            <h2 className="display-2 mb-6">{title}</h2>
            <p className="body-lg text-paper/80 mb-8 max-w-md">{body}</p>
            {cta && (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 text-sm font-medium border-b border-paper/40 pb-1 hover:border-paper transition-colors group"
              >
                {cta.label}
                <ArrowRight
                  size={16}
                  strokeWidth={1.75}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
