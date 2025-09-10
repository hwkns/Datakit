import React from 'react';
import { Book, History, ExternalLink, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import FeedbackButton from '@/components/common/FeedbackButton';

import discord from '@/assets/discord.png';

export const DISCORD_URL = 'https://discord.gg/gZmXmhbBdP';

interface UnifiedActionButtonsProps {
  /** Context for feedback button */
  feedbackContext?: string;
  /** Custom Discord invite URL */
  discordInviteUrl?: string;
  /** Custom documentation URL */
  docsUrl?: string;
  /** Custom landing page URL */
  landingPageUrl?: string;
  /** Custom ProductHunt URL */
  productHuntUrl?: string;
}

/**
 * Action buttons with consistent styling and hierarchy
 * Docs > Discord > Feedback > ProductHunt
 */
const ActionButtons: React.FC<UnifiedActionButtonsProps> = ({
  feedbackContext,
  discordInviteUrl = DISCORD_URL,
  docsUrl = 'https://docs.datakit.page/',
  landingPageUrl = 'https://datakit.studio',
  // productHuntUrl = "https://www.producthunt.com/products/datakit",
}) => {
  return (
    <div className="flex items-center gap-4">
      {/* Primary Actions - Left side */}
      <div className="flex items-center gap-2">
        {/* Studio Link */}
        <Button variant="ghost" size="sm" asChild>
          <a
            href={landingPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <ExternalLink size={14} className="text-white/80 mr-1.5" />
            <span className="text-xs bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">DataKit Studio</span>
          </a>
        </Button>

        {/* Feedback Button - Primary CTA */}
        <FeedbackButton
          context={feedbackContext}
          variant="primary"
          size="sm"
          text="Feedback"
          className=""
        />
      </div>

      {/* Icon Actions - Right side */}
      <div className="flex items-center gap-1">
        <Tooltip placement="bottom" content="Documentation">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="!px-2 !py-1 min-w-0"
          >
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View documentation"
            >
              <Book size={14} />
            </a>
          </Button>
        </Tooltip>

        <Tooltip placement="bottom" content="Discord">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="!px-2 !py-1 min-w-0"
          >
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join our Discord"
            >
              <img
                src={discord}
                alt="Discord"
                className="w-4 h-4"
              />
            </a>
          </Button>
        </Tooltip>

        <Tooltip placement="bottom" content="What's New">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="!px-2 !py-1 min-w-0"
          >
            <a
              href="https://datakit.canny.io/changelog"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View changelog"
            >
              <History size={14} />
            </a>
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default ActionButtons;
