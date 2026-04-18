package dnaanalyzer.repository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import dnaanalyzer.model.AnalysisResult;

public class AnalysisHistory {
    private final List<AnalysisResult> history;

    public AnalysisHistory() {
        this.history = new ArrayList<>();
    }

    public void add(AnalysisResult result) {
        history.add(result);
    }

    public List<AnalysisResult> getAll() {
        return Collections.unmodifiableList(history);
    }

    public void clear() {
        history.clear();
    }

    public String toMultilineText() {
        if (history.isEmpty()) {
            return "No analysis history yet.";
        }
        StringBuilder builder = new StringBuilder();
        int index = 1;
        for (AnalysisResult result : history) {
            builder.append("--- Record ").append(index++).append(" ---").append(System.lineSeparator());
            builder.append(result.toDisplayText()).append(System.lineSeparator());
        }
        return builder.toString();
    }

    public void exportTo(Path filePath) throws IOException {
        Files.writeString(filePath, toMultilineText());
    }
}
