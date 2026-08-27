ALTER TABLE `ledger` ADD `note` text;--> statement-breakpoint
ALTER TABLE `users` ADD `has_completed_onboarding` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bill_reminders_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `rollover_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `savings_goal_minor` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `savings_label` text DEFAULT 'Emergency & Runway Fund' NOT NULL;