package com.eneml.ajs.integration.internal.web;

import com.eneml.ajs.integration.internal.exporter.NativeXmlExporter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;

/**
 * Streams a snapshot of the journal's structured content as a ZIP for
 * archive / migration purposes. Admin-only.
 */
@RestController
@RequestMapping("/api/v1/integrations/native-xml-export")
@RequiredArgsConstructor
@Tag(name = "Native XML export")
class NativeXmlExportController {

    private final NativeXmlExporter exporter;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Download a ZIP snapshot of the journal's structured content")
    public void export(HttpServletResponse response) throws IOException {
        String filename = "journal-export-" + LocalDate.now() + ".zip";
        response.setStatus(200);
        response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + filename + "\"");
        exporter.writeTo(response.getOutputStream());
    }
}
