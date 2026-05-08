package com.eneml.ajs.review.internal.application;

import com.eneml.ajs.review.api.ReviewFormElementType;
import com.eneml.ajs.review.internal.domain.ReviewForm;
import com.eneml.ajs.review.internal.domain.ReviewFormElement;
import com.eneml.ajs.review.internal.persistence.ReviewFormRepository;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewFormService {

    private final ReviewFormRepository repository;

    public List<ReviewForm> listAll() {
        return repository.findAllByOrderByCodeAsc();
    }

    public ReviewForm findById(Long id) {
        return repository.findWithElementsById(id)
                .orElseThrow(() -> new NotFoundException("review form not found: " + id));
    }

    @Transactional
    public ReviewForm create(String code,
                              Map<String, String> title,
                              Map<String, String> description,
                              boolean active) {
        if (repository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("review form code already in use: " + code);
        }
        ReviewForm form = new ReviewForm();
        form.setCode(code);
        form.setTitle(title == null ? new HashMap<>() : title);
        form.setDescription(description == null ? new HashMap<>() : description);
        form.setActive(active);
        return repository.save(form);
    }

    @Transactional
    public ReviewForm update(Long id,
                              Map<String, String> title,
                              Map<String, String> description,
                              boolean active) {
        ReviewForm form = findById(id);
        if (title != null) form.setTitle(title);
        if (description != null) form.setDescription(description);
        form.setActive(active);
        return form;
    }

    @Transactional
    public void delete(Long id) {
        ReviewForm form = findById(id);
        repository.delete(form);
    }

    @Transactional
    public ReviewFormElement addElement(Long formId,
                                         ReviewFormElementType type,
                                         boolean included,
                                         boolean required,
                                         Map<String, String> question,
                                         Map<String, String> description,
                                         List<Map<String, Object>> possibleResponses) {
        ReviewForm form = findById(formId);
        validateChoiceOptions(type, possibleResponses);
        ReviewFormElement el = new ReviewFormElement();
        el.setForm(form);
        el.setSeq(form.getElements().stream().mapToInt(ReviewFormElement::getSeq).max().orElse(-1) + 1);
        el.setElementType(type);
        el.setIncluded(included);
        el.setRequired(required);
        el.setQuestion(question == null ? new HashMap<>() : question);
        el.setDescription(description == null ? new HashMap<>() : description);
        el.setPossibleResponses(possibleResponses == null ? List.of() : possibleResponses);
        form.getElements().add(el);
        return el;
    }

    @Transactional
    public ReviewFormElement updateElement(Long formId,
                                            Long elementId,
                                            ReviewFormElementType type,
                                            boolean included,
                                            boolean required,
                                            Map<String, String> question,
                                            Map<String, String> description,
                                            List<Map<String, Object>> possibleResponses) {
        ReviewForm form = findById(formId);
        ReviewFormElement el = form.getElements().stream()
                .filter(e -> e.getId().equals(elementId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("element not found: " + elementId));
        validateChoiceOptions(type, possibleResponses);
        el.setElementType(type);
        el.setIncluded(included);
        el.setRequired(required);
        if (question != null) el.setQuestion(question);
        if (description != null) el.setDescription(description);
        if (possibleResponses != null) el.setPossibleResponses(possibleResponses);
        return el;
    }

    @Transactional
    public void deleteElement(Long formId, Long elementId) {
        ReviewForm form = findById(formId);
        boolean removed = form.getElements()
                .removeIf(e -> e.getId().equals(elementId));
        if (!removed) {
            throw new NotFoundException("element not found: " + elementId);
        }
    }

    @Transactional
    public ReviewForm reorderElements(Long formId, List<Long> orderedElementIds) {
        ReviewForm form = findById(formId);
        Map<Long, ReviewFormElement> byId = new HashMap<>();
        for (ReviewFormElement e : form.getElements()) byId.put(e.getId(), e);
        for (int i = 0; i < orderedElementIds.size(); i++) {
            ReviewFormElement el = byId.get(orderedElementIds.get(i));
            if (el == null) {
                throw new NotFoundException("element not in this form: " + orderedElementIds.get(i));
            }
            el.setSeq(i);
        }
        return form;
    }

    private static void validateChoiceOptions(ReviewFormElementType type,
                                                List<Map<String, Object>> options) {
        if (!type.isChoice()) return;
        if (options == null || options.isEmpty()) {
            throw new IllegalArgumentException(
                    "choice element types require at least one possibleResponses entry");
        }
        for (Map<String, Object> opt : options) {
            Object value = opt.get("value");
            if (value == null || value.toString().isBlank()) {
                throw new IllegalArgumentException("each option must carry a non-blank 'value'");
            }
        }
    }
}
