package com.eneml.ajs.editorial.internal.engine.handler;

import com.eneml.ajs.editorial.internal.engine.DecisionHandler;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.submission.api.SubmissionStage;
import com.eneml.ajs.submission.api.SubmissionStatus;
import com.eneml.ajs.submission.api.SubmissionSummary;

import java.util.Set;

abstract class AbstractDecisionHandler implements DecisionHandler {

    protected void requireStage(SubmissionSummary current, SubmissionStage... allowed) {
        if (!Set.of(allowed).contains(current.stage())) {
            throw new ConflictException(
                    "%s decision is not valid from stage %s"
                            .formatted(type(), current.stage()));
        }
    }

    protected void requireStatus(SubmissionSummary current, SubmissionStatus... allowed) {
        if (!Set.of(allowed).contains(current.status())) {
            throw new ConflictException(
                    "%s decision is not valid for status %s"
                            .formatted(type(), current.status()));
        }
    }
}
