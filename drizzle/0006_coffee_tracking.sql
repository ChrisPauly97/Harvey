CREATE TABLE IF NOT EXISTS `equipment` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `brand` text,
  `type` text NOT NULL,
  `notes` text,
  `is_active` integer NOT NULL DEFAULT 1,
  `added_at` integer NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS `equipment_type_idx` ON `equipment` (`type`);

CREATE TABLE IF NOT EXISTS `coffees` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `origin` text,
  `roaster` text,
  `roast_date` text,
  `roast_level` text,
  `process` text,
  `variety` text,
  `description` text,
  `is_active` integer NOT NULL DEFAULT 1,
  `image_url` text,
  `added_at` integer NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS `coffees_is_active_idx` ON `coffees` (`is_active`);

CREATE TABLE IF NOT EXISTS `brews` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `coffee_id` integer REFERENCES `coffees`(`id`) ON DELETE SET NULL,
  `brewing_device_id` integer REFERENCES `equipment`(`id`) ON DELETE SET NULL,
  `grinder_id` integer REFERENCES `equipment`(`id`) ON DELETE SET NULL,
  `brew_method` text NOT NULL,
  `grind_size` text,
  `weight_in` real,
  `weight_out` real,
  `extraction_time` integer,
  `water_temperature` integer,
  `tasting_notes` text,
  `rating` integer,
  `notes` text,
  `brewed_at` integer NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS `brews_coffee_id_idx` ON `brews` (`coffee_id`);
CREATE INDEX IF NOT EXISTS `brews_brewed_at_idx` ON `brews` (`brewed_at`);
