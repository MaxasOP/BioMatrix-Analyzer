package dnaanalyzer.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import dnaanalyzer.exception.InvalidNucleotideException;
import dnaanalyzer.model.AnalysisResult;
import dnaanalyzer.model.DNASequence;
import dnaanalyzer.model.GeneticSequence;
import dnaanalyzer.model.RNASequence;
import dnaanalyzer.repository.AnalysisHistory;

public class SequenceAnalyzerService {
    private final SequenceValidator validator;
    private final AnalysisHistory history;

    public SequenceAnalyzerService(SequenceValidator validator, AnalysisHistory history) {
        this.validator = validator;
        this.history = history;
    }

    public AnalysisResult analyzeSequence(String sequence) throws InvalidNucleotideException {
        return analyzeSequence(sequence, true);
    }

    public AnalysisResult analyzeSequence(String sequence, boolean removeInternalSpaces) throws InvalidNucleotideException {
        String clean = validator.sanitize(sequence, removeInternalSpaces);
        GeneticSequence geneticSequence = validator.looksLikeRNA(clean) ? new RNASequence(clean) : new DNASequence(clean);
        AnalysisResult result = geneticSequence.analyze();
        history.add(result);
        return result;
    }

    public AnalysisResult analyzeSequence(Path filePath) throws InvalidNucleotideException, IOException {
        String sequence = readSequenceFromFile(filePath);
        return analyzeSequence(sequence, false);
    }

    public String readSequenceFromFile(Path filePath) throws IOException {
        List<String> lines = Files.readAllLines(filePath);
        StringBuilder builder = new StringBuilder();

        for (String line : lines) {
            if (line == null) {
                continue;
            }

            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith(">") || trimmed.startsWith(";")) {
                continue;
            }

            builder.append(trimmed.replaceAll("\\s+", ""));
        }

        if (builder.length() == 0) {
            return "";
        }

        return builder.toString().toUpperCase();
    }

    public AnalysisHistory getHistory() {
        return history;
    }
}
