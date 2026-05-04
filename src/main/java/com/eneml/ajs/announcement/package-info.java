/**
 * Announcement module — short editorial messages shown on the public site
 * (calls for papers, journal news, special-issue invitations). Each
 * announcement carries a localized title and body, an optional date
 * window, and a type that lets the public site filter by category.
 *
 * <p>Owns: Announcement.
 * <br>Emits: AnnouncementPosted, AnnouncementWithdrawn.
 * <br>Consumes: nothing.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Announcement",
    allowedDependencies = { "shared" }
)
package com.eneml.ajs.announcement;
