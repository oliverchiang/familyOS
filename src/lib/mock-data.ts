import type { KidWeek } from "./types";

// Placeholder data for the prototype — matches Claude Design's mockup.
// Reward minutes and homework step counts are stand-ins pending Oliver's
// confirmation (see docs/PRD.md "Open Questions"). Will be replaced by data
// loaded from the database in a later increment.

export const tylerWeek: KidWeek = {
  kidName: "Tyler",
  weekLabel: "Jun 15 – 21",
  isCurrentWeek: true,
  weeklyCapMins: 120,
  days: [
    { label: "M", date: 15, active: true, isToday: false },
    { label: "T", date: 16, active: true, isToday: false },
    { label: "W", date: 17, active: false, isToday: true },
    { label: "T", date: 18, active: false, isToday: false },
    { label: "F", date: 19, active: false, isToday: false },
    { label: "S", date: 20, active: false, isToday: false },
    { label: "S", date: 21, active: false, isToday: false },
  ],
  tasks: [
    {
      id: "drums",
      title: "Drums",
      icon: "drums",
      tile: "drums",
      display: "tally",
      target: 4,
      done: 2,
      rewardMins: 40,
    },
    {
      id: "chinese",
      title: "Chinese homework",
      icon: "book",
      tile: "book",
      display: "bar",
      target: 5,
      done: 3,
      rewardMins: 30,
    },
    {
      id: "maths",
      title: "Maths homework",
      icon: "pencil",
      tile: "maths",
      display: "bar",
      target: 4,
      done: 4,
      rewardMins: 30,
    },
  ],
};
