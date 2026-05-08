package com.eneml.ajs.category.internal.web;

import com.eneml.ajs.category.internal.application.CategoryService;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationStatus;
import com.eneml.ajs.publication.api.PublicationSummary;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories/{categoryId}/publications")
@RequiredArgsConstructor
@Tag(name = "Publications in category")
class CategoryPublicationsController {

    private final CategoryService categoryService;
    private final PublicationLookup publicationLookup;

    @GetMapping
    public List<PublicationSummary> list(@PathVariable Long categoryId) {
        // Only return PUBLISHED renditions; the public site never wants drafts
        // or scheduled rows. Sorting matches the category's sortOption.
        var sortOption = categoryService.findById(categoryId).sortOption();
        List<Long> ids = categoryService.publicationIdsInCategory(categoryId);
        List<PublicationSummary> rows = ids.stream()
                .map(publicationLookup::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .filter(p -> p.status() == PublicationStatus.PUBLISHED)
                .toList();
        return switch (sortOption) {
            case DATE_PUBLISHED_DESC -> rows.stream()
                    .sorted((a, b) -> compareDates(b.datePublished(), a.datePublished()))
                    .toList();
            case DATE_PUBLISHED_ASC -> rows.stream()
                    .sorted((a, b) -> compareDates(a.datePublished(), b.datePublished()))
                    .toList();
            case TITLE_ASC -> rows.stream()
                    .sorted((a, b) -> firstTitle(a).compareToIgnoreCase(firstTitle(b)))
                    .toList();
            case MANUAL -> rows;
        };
    }

    private static int compareDates(java.time.Instant a, java.time.Instant b) {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.compareTo(b);
    }

    private static String firstTitle(PublicationSummary p) {
        if (p.title() == null || p.title().isEmpty()) return "";
        return p.title().values().stream().filter(v -> v != null && !v.isBlank()).findFirst().orElse("");
    }
}
