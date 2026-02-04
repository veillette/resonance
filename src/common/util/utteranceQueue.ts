/**
 * utteranceQueue.ts
 *
 * Creates a shared UtteranceQueue instance for accessibility alerts.
 * This module provides a singleton utterance queue that can be used
 * throughout the simulation for screen reader announcements.
 */

import {
  UtteranceQueue,
  AriaLiveAnnouncer,
} from "scenerystack/utterance-queue";

// Create a shared AriaLiveAnnouncer for screen reader alerts
const ariaLiveAnnouncer = new AriaLiveAnnouncer();

// Create a shared UtteranceQueue instance
const utteranceQueue = new UtteranceQueue(ariaLiveAnnouncer);

export { utteranceQueue };
