/**
 * Discussion module — threaded conversations the editorial team holds
 * about a submission, scoped to a workflow stage. Each thread has an
 * explicit participant list; only listed users see the messages.
 *
 * <p>Owns: Discussion, DiscussionMessage, DiscussionParticipant.
 * <br>Emits: DiscussionStarted, DiscussionMessagePosted, DiscussionClosed.
 * <br>Consumes: nothing — peripheral modules listen to its events
 * (messaging fans out notifications + emails; audit logs activity).
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Discussion",
    allowedDependencies = { "shared", "submission::api", "identity::api", "storage::api" }
)
package com.eneml.ajs.discussion;
