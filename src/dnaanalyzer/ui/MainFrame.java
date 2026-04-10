package dnaanalyzer.ui;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GridLayout;
import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.awt.event.InputEvent;
import java.awt.event.KeyEvent;
import java.io.File;
import java.io.IOException;
import java.util.concurrent.ThreadLocalRandom;

import javax.swing.AbstractAction;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSlider;
import javax.swing.JTabbedPane;
import javax.swing.JTextArea;
import javax.swing.KeyStroke;
import javax.swing.SwingConstants;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;

import dnaanalyzer.exception.InvalidNucleotideException;
import dnaanalyzer.model.AnalysisResult;
import dnaanalyzer.repository.AnalysisHistory;
import dnaanalyzer.service.SequenceAnalyzerService;
import dnaanalyzer.service.SequenceValidator;

public class MainFrame extends JFrame {
    private static final Color BG = new Color(244, 248, 252);
    private static final Color CARD_BG = new Color(255, 255, 255);
    private static final Color PRIMARY = new Color(8, 94, 162);
    private static final Color SECONDARY = new Color(19, 143, 108);
    private static final Color STATUS_OK = new Color(22, 109, 57);
    private static final Color STATUS_ERROR = new Color(163, 42, 22);
    private static final Color STATUS_INFO = new Color(70, 70, 70);

    private final JTextArea inputArea;
    private final JTextArea outputArea;
    private final SequenceAnalyzerService analyzerService;
    private final JButton analyzeBtn;
    private final JLabel detectedTypeLabel;
    private final JLabel infoLabel;
    private final JLabel statusLabel;
    private final JLabel streakLabel;
    private final JTabbedPane resultTabs;
    private StrandVisualizer strandVisualizer;
    private int successfulAnalyses;

    public MainFrame() {
        super("DNA Sequence Analyzer - BioLab");

        this.analyzerService = new SequenceAnalyzerService(new SequenceValidator(), new AnalysisHistory());
        this.inputArea = new JTextArea(6, 40);
        this.outputArea = new JTextArea(15, 40);
        this.analyzeBtn = new JButton("Analyze Sequence");
        this.detectedTypeLabel = new JLabel("Detected: N/A");
        this.infoLabel = new JLabel("Length: 0 | Allowed: A, C, G, T, U");
        this.statusLabel = new JLabel("Ready.");
        this.streakLabel = new JLabel("Analyses this run: 0");
        this.resultTabs = new JTabbedPane();
        this.successfulAnalyses = 0;

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(new Dimension(980, 700));
        getContentPane().setBackground(BG);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout(12, 12));

        configureTextAreas();
        registerInputListeners();
        registerKeyboardShortcuts();

        add(buildHeroPanel(), BorderLayout.NORTH);
        add(buildWorkspacePanel(), BorderLayout.CENTER);
        add(buildFooterPanel(), BorderLayout.SOUTH);

        updateInputInsights();
    }

    private void configureTextAreas() {
        inputArea.setLineWrap(true);
        inputArea.setWrapStyleWord(true);
        inputArea.setFont(new Font("Consolas", Font.PLAIN, 16));
        inputArea.setBorder(new EmptyBorder(12, 12, 12, 12));

        outputArea.setEditable(false);
        outputArea.setLineWrap(true);
        outputArea.setWrapStyleWord(true);
        outputArea.setFont(new Font("Consolas", Font.PLAIN, 14));
        outputArea.setBorder(new EmptyBorder(12, 12, 12, 12));
    }

    private void registerInputListeners() {
        inputArea.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                updateInputInsights();
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                updateInputInsights();
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                updateInputInsights();
            }
        });
    }

    private void registerKeyboardShortcuts() {
        getRootPane().getInputMap(JPanel.WHEN_IN_FOCUSED_WINDOW)
                .put(KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, InputEvent.CTRL_DOWN_MASK), "analyze");
        getRootPane().getActionMap().put("analyze", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                if (analyzeBtn.isEnabled()) {
                    handleAnalyze();
                }
            }
        });

        getRootPane().getInputMap(JPanel.WHEN_IN_FOCUSED_WINDOW)
                .put(KeyStroke.getKeyStroke(KeyEvent.VK_L, InputEvent.CTRL_DOWN_MASK), "load");
        getRootPane().getActionMap().put("load", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                handleLoadAndAnalyze();
            }
        });

        getRootPane().getInputMap(JPanel.WHEN_IN_FOCUSED_WINDOW)
                .put(KeyStroke.getKeyStroke(KeyEvent.VK_K, InputEvent.CTRL_DOWN_MASK), "clear");
        getRootPane().getActionMap().put("clear", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                clearAll();
            }
        });
    }

    private JPanel buildHeroPanel() {
        GradientPanel hero = new GradientPanel(new Color(3, 64, 120), new Color(12, 136, 198));
        hero.setLayout(new BorderLayout());
        hero.setBorder(new EmptyBorder(18, 18, 18, 18));

        JLabel titleLabel = new JLabel("DNA/RNA Analyzer - BioLab");
        titleLabel.setForeground(Color.WHITE);
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 26));

        JLabel subtitle = new JLabel("Live validation, smart generation, and visual nucleotide dashboard");
        subtitle.setForeground(new Color(225, 242, 255));
        subtitle.setFont(new Font("Segoe UI", Font.PLAIN, 14));

        JLabel shortcutHint = new JLabel("Shortcuts: Ctrl+Enter Analyze | Ctrl+L Load | Ctrl+K Clear");
        shortcutHint.setForeground(new Color(225, 242, 255));
        shortcutHint.setFont(new Font("Segoe UI", Font.PLAIN, 12));

        JPanel textPanel = new JPanel(new GridLayout(3, 1, 0, 4));
        textPanel.setOpaque(false);
        textPanel.add(titleLabel);
        textPanel.add(subtitle);
        textPanel.add(shortcutHint);

        hero.add(textPanel, BorderLayout.CENTER);
        return hero;
    }

    private JPanel buildWorkspacePanel() {
        JPanel workspace = new JPanel(new BorderLayout(12, 12));
        workspace.setOpaque(false);
        workspace.setBorder(new EmptyBorder(0, 12, 0, 12));

        workspace.add(buildInputPanel(), BorderLayout.NORTH);
        workspace.add(buildResultPanel(), BorderLayout.CENTER);
        return workspace;
    }

    private JPanel buildInputPanel() {
        JPanel card = createCardPanel(new BorderLayout(12, 12));

        JLabel inputTitle = new JLabel("Sequence Input");
        inputTitle.setFont(new Font("Segoe UI", Font.BOLD, 16));

        JPanel insightPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 14, 0));
        insightPanel.setOpaque(false);
        detectedTypeLabel.setFont(new Font("Segoe UI", Font.BOLD, 13));
        infoLabel.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        streakLabel.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        insightPanel.add(detectedTypeLabel);
        insightPanel.add(infoLabel);
        insightPanel.add(streakLabel);

        JPanel top = new JPanel(new BorderLayout(0, 6));
        top.setOpaque(false);
        top.add(inputTitle, BorderLayout.NORTH);
        top.add(insightPanel, BorderLayout.SOUTH);

        card.add(top, BorderLayout.NORTH);
        card.add(new JScrollPane(inputArea), BorderLayout.CENTER);
        card.add(buildQuickActionsPanel(), BorderLayout.EAST);
        return card;
    }

    private JPanel buildQuickActionsPanel() {
        JPanel quickPanel = new JPanel(new BorderLayout(0, 8));
        quickPanel.setOpaque(false);
        quickPanel.setBorder(new EmptyBorder(2, 8, 2, 2));

        JLabel quickLabel = new JLabel("Quick Actions", SwingConstants.CENTER);
        quickLabel.setFont(new Font("Segoe UI", Font.BOLD, 13));

        JSlider lengthSlider = new JSlider(12, 120, 30);
        lengthSlider.setOpaque(false);
        lengthSlider.setMajorTickSpacing(36);
        lengthSlider.setMinorTickSpacing(12);
        lengthSlider.setPaintTicks(true);
        JLabel sliderLabel = new JLabel("Sample Length: 30", SwingConstants.CENTER);
        sliderLabel.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        lengthSlider.addChangeListener(e -> sliderLabel.setText("Sample Length: " + lengthSlider.getValue()));

        JButton sampleDnaBtn = new JButton("Generate DNA");
        JButton sampleRnaBtn = new JButton("Generate RNA");
        JButton mutateBtn = new JButton("Mutate Current");

        styleButton(sampleDnaBtn, SECONDARY, true);
        styleButton(sampleRnaBtn, new Color(36, 116, 92), true);
        styleButton(mutateBtn, new Color(98, 89, 181), true);

        sampleDnaBtn.addActionListener(e -> loadGeneratedSequence(false, lengthSlider.getValue()));
        sampleRnaBtn.addActionListener(e -> loadGeneratedSequence(true, lengthSlider.getValue()));
        mutateBtn.addActionListener(e -> mutateCurrentSequence());

        JPanel actions = new JPanel(new GridLayout(6, 1, 0, 6));
        actions.setOpaque(false);
        actions.add(quickLabel);
        actions.add(sliderLabel);
        actions.add(lengthSlider);
        actions.add(sampleDnaBtn);
        actions.add(sampleRnaBtn);
        actions.add(mutateBtn);

        quickPanel.add(actions, BorderLayout.CENTER);
        return quickPanel;
    }

    private JPanel buildResultPanel() {
        JPanel card = createCardPanel(new BorderLayout());
        card.add(new JLabel("Analysis Output", SwingConstants.LEFT), BorderLayout.NORTH);

        resultTabs.addTab("Report", new JScrollPane(outputArea));
        resultTabs.addTab("Nucleotide Dashboard", buildDashboardPanel());

        card.add(resultTabs, BorderLayout.CENTER);
        return card;
    }

    private JPanel buildButtonPanel() {
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 12, 8));
        buttonPanel.setOpaque(false);

        JButton loadBtn = new JButton("Load From File");
        JButton historyBtn = new JButton("Show History");
        JButton copyBtn = new JButton("Copy Result");
        JButton clearBtn = new JButton("Clear");

        styleButton(analyzeBtn, PRIMARY, true);
        styleButton(loadBtn, new Color(63, 93, 138), true);
        styleButton(historyBtn, new Color(104, 126, 159), true);
        styleButton(copyBtn, new Color(73, 132, 114), true);
        styleButton(clearBtn, new Color(180, 75, 75), true);

        analyzeBtn.setToolTipText("Analyze current input (Ctrl+Enter)");
        loadBtn.setToolTipText("Load and analyze from a text or FASTA file (Ctrl+L)");
        historyBtn.setToolTipText("Show analysis history");
        copyBtn.setToolTipText("Copy output text to clipboard");
        clearBtn.setToolTipText("Clear input, output, and history");

        analyzeBtn.addActionListener(e -> handleAnalyze());
        loadBtn.addActionListener(e -> handleLoadAndAnalyze());
        historyBtn.addActionListener(e -> {
            outputArea.setText(analyzerService.getHistory().toMultilineText());
            setStatus("History displayed.", STATUS_INFO);
        });
        copyBtn.addActionListener(e -> {
            if (!outputArea.getText().isBlank()) {
                outputArea.selectAll();
                outputArea.copy();
                outputArea.select(0, 0);
                setStatus("Result copied to clipboard.", STATUS_OK);
            } else {
                setStatus("Nothing to copy yet.", STATUS_INFO);
            }
        });
        clearBtn.addActionListener(e -> clearAll());

        buttonPanel.add(analyzeBtn);
        buttonPanel.add(loadBtn);
        buttonPanel.add(historyBtn);
        buttonPanel.add(copyBtn);
        buttonPanel.add(clearBtn);
        return buttonPanel;
    }

    private JPanel buildFooterPanel() {
        JPanel footerPanel = new JPanel(new BorderLayout(0, 6));
        footerPanel.setOpaque(false);
        footerPanel.setBorder(new EmptyBorder(0, 12, 10, 12));
        footerPanel.add(buildButtonPanel(), BorderLayout.CENTER);

        JPanel statusPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        statusPanel.setOpaque(false);
        statusPanel.add(new JLabel("Status:"));
        statusPanel.add(statusLabel);

        footerPanel.add(statusPanel, BorderLayout.SOUTH);
        return footerPanel;
    }

    private void handleAnalyze() {
        try {
            AnalysisResult result = analyzerService.analyzeSequence(inputArea.getText());
            outputArea.setText(result.toDisplayText());
            successfulAnalyses++;
            streakLabel.setText("Analyses this run: " + successfulAnalyses);
            updateDashboard(result);
            resultTabs.setSelectedIndex(1);
            setStatus("Analysis completed successfully.", STATUS_OK);
        } catch (InvalidNucleotideException ex) {
            setStatus("Validation error. Check your sequence.", STATUS_ERROR);
            showError(ex.getMessage());
        } catch (Exception ex) {
            setStatus("Unexpected error during analysis.", STATUS_ERROR);
            showError("Unexpected error: " + ex.getMessage());
        }
    }

    private void handleLoadAndAnalyze() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Select Sequence File");
        chooser.setFileFilter(new FileNameExtensionFilter("Sequence files (*.txt, *.fa, *.fasta)", "txt", "fa", "fasta"));

        int result = chooser.showOpenDialog(this);
        if (result != JFileChooser.APPROVE_OPTION) {
            setStatus("File selection cancelled.", STATUS_INFO);
            return;
        }

        File selected = chooser.getSelectedFile();
        try {
            AnalysisResult analysis = analyzerService.analyzeSequence(selected.toPath());
            inputArea.setText(analysis.getInputSequence());
            outputArea.setText(analysis.toDisplayText());
            successfulAnalyses++;
            streakLabel.setText("Analyses this run: " + successfulAnalyses);
            updateDashboard(analysis);
            resultTabs.setSelectedIndex(1);
            setStatus("Loaded and analyzed: " + selected.getName(), STATUS_OK);
        } catch (InvalidNucleotideException | IOException ex) {
            setStatus("Unable to load selected file.", STATUS_ERROR);
            showError(ex.getMessage());
        }
    }

    private void updateInputInsights() {
        String normalized = normalizeForPreview(inputArea.getText());
        int length = normalized.length();

        analyzeBtn.setEnabled(length > 0);
        infoLabel.setText("Length: " + length + " | Allowed: A, C, G, T, U");

        if (length == 0) {
            detectedTypeLabel.setText("Detected: N/A");
            detectedTypeLabel.setForeground(new Color(70, 70, 70));
            return;
        }

        boolean hasT = normalized.contains("T");
        boolean hasU = normalized.contains("U");
        boolean onlyNucleotides = normalized.matches("[ACGTU]+$");

        if (!onlyNucleotides || (hasT && hasU)) {
            detectedTypeLabel.setText("Detected: Invalid / Mixed");
            detectedTypeLabel.setForeground(STATUS_ERROR);
            return;
        }

        detectedTypeLabel.setText("Detected: " + (hasU ? "RNA" : "DNA"));
        detectedTypeLabel.setForeground(new Color(19, 117, 63));
    }

    private String normalizeForPreview(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replaceAll("\\s+", "").toUpperCase();
    }

    private void loadGeneratedSequence(boolean rna, int length) {
        char[] letters = rna ? new char[] {'A', 'C', 'G', 'U'} : new char[] {'A', 'C', 'G', 'T'};
        StringBuilder builder = new StringBuilder(length);
        ThreadLocalRandom random = ThreadLocalRandom.current();

        for (int i = 0; i < length; i++) {
            builder.append(letters[random.nextInt(letters.length)]);
        }

        inputArea.setText(builder.toString());
        setStatus("Generated " + (rna ? "RNA" : "DNA") + " sample of length " + length + ".", STATUS_OK);
    }

    private void mutateCurrentSequence() {
        String normalized = normalizeForPreview(inputArea.getText());
        if (normalized.isBlank()) {
            setStatus("Nothing to mutate. Generate or type a sequence first.", STATUS_INFO);
            return;
        }

        char[] seq = normalized.toCharArray();
        ThreadLocalRandom random = ThreadLocalRandom.current();
        int changes = Math.max(1, seq.length / 20);

        for (int i = 0; i < changes; i++) {
            int idx = random.nextInt(seq.length);
            seq[idx] = mutateNucleotide(seq[idx], random);
        }

        inputArea.setText(new String(seq));
        setStatus("Applied " + changes + " random mutation(s).", STATUS_OK);
    }

    private char mutateNucleotide(char original, ThreadLocalRandom random) {
        char[] options = (original == 'U')
                ? new char[] {'A', 'C', 'G', 'U'}
                : new char[] {'A', 'C', 'G', 'T'};

        char replacement = original;
        while (replacement == original) {
            replacement = options[random.nextInt(options.length)];
        }
        return replacement;
    }

    private void updateDashboard(AnalysisResult result) {
        strandVisualizer.updateSequence(result.getInputSequence(), result.getGcPercentage());
    }

    private JPanel buildDashboardPanel() {
        JPanel dashboard = new JPanel(new BorderLayout());
        dashboard.setBorder(new EmptyBorder(20, 20, 20, 20));
        dashboard.setBackground(CARD_BG);

        JLabel header = new JLabel("DNA/RNA Strand Visualization");
        header.setFont(new Font("Segoe UI", Font.BOLD, 18));
        header.setForeground(new Color(50, 50, 50));
        header.setHorizontalAlignment(SwingConstants.CENTER);
        dashboard.add(header, BorderLayout.NORTH);

        strandVisualizer = new StrandVisualizer();
        dashboard.add(strandVisualizer, BorderLayout.CENTER);

        JLabel tip = new JLabel("Scrolling strand visualization | Colors: A=orange C=blue G=green T=purple U=red | GC arc");
        tip.setFont(new Font("Segoe UI", Font.ITALIC, 11));
        tip.setForeground(new Color(100, 100, 100));
        tip.setHorizontalAlignment(SwingConstants.CENTER);
        dashboard.add(tip, BorderLayout.SOUTH);

        return dashboard;
    }

    private void clearAll() {
        inputArea.setText("");
        outputArea.setText("");
        analyzerService.getHistory().clear();
        successfulAnalyses = 0;
        streakLabel.setText("Analyses this run: 0");
        resetDashboard();
        setStatus("Cleared input, output, and history.", STATUS_INFO);
    }

    private void resetDashboard() {
        if (strandVisualizer != null) {
            strandVisualizer.updateSequence("", 0.0);
        }
    }

    private JPanel createCardPanel(BorderLayout layout) {
        JPanel panel = new JPanel(layout);
        panel.setBackground(CARD_BG);
        panel.setBorder(new EmptyBorder(12, 12, 12, 12));
        panel.setBorder(new LineBorder(new Color(213, 224, 235), 1, true));
        return panel;
    }

    private void styleButton(JButton button, Color bg, boolean whiteText) {
        button.setBackground(bg);
        button.setForeground(whiteText ? Color.WHITE : Color.BLACK);
        button.setFocusPainted(false);
        button.setBorder(new EmptyBorder(9, 12, 9, 12));
        button.setFont(new Font("Segoe UI", Font.BOLD, 12));
        button.setMargin(new Insets(8, 12, 8, 12));
    }

    private void setStatus(String message, Color color) {
        statusLabel.setForeground(color);
        statusLabel.setText(message);
    }

    private void showError(String message) {
        JOptionPane.showMessageDialog(this, message, "Analysis Error", JOptionPane.ERROR_MESSAGE);
    }

    private static class GradientPanel extends JPanel {
        private final Color start;
        private final Color end;

        GradientPanel(Color start, Color end) {
            this.start = start;
            this.end = end;
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2d = (Graphics2D) g.create();
            g2d.setPaint(new GradientPaint(0, 0, start, getWidth(), getHeight(), end));
            g2d.fillRect(0, 0, getWidth(), getHeight());
            g2d.dispose();
        }
    }
}
