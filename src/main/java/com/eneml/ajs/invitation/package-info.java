/**
 * Invitation module — invite users (typically reviewers) who don't yet
 * have an account. The journal sends a unique signed-link email; the
 * recipient clicks through to a self-registration form pre-bound to
 * their invitation. Once they finish, downstream code (e.g. review
 * assignment creation) reads the invitation's payload to wire the new
 * user into the editorial flow that triggered the invite.
 *
 * <p>Owns: UserInvitation.
 * <br>Emits: InvitationCreated.
 * <br>Consumes: nothing — the trigger is direct API calls from the
 * editor's UI plus the InvitationCreated listener in messaging.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Invitation",
    allowedDependencies = { "shared", "identity::api" }
)
package com.eneml.ajs.invitation;
