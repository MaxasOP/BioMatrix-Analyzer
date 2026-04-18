# DNA Sequence Analyzer

A Java Swing application for validating and analyzing DNA/RNA sequences. Supports GC-content calculation, nucleotide counts, complement strands, transcription, FASTA/text file loading, and analysis history export.

## Table of Contents
- [Features](#features)
- [Syllabus Coverage](#syllabus-coverage)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Demo Checklist](#demo-checklist)
- [License](#license)

## Features
| Feature | Description |
|---------|-------------|
| Sequence Validation | Checks for valid nucleotides (A/C/G/T/U); throws `InvalidNucleotideException` |
| Analysis | Nucleotide counts, GC-content %, complement strand (DNA), transcription (DNA→RNA)/reverse (RNA→DNA) |
| GUI | Swing interface with input, file load, analysis buttons, history view, history export, visualizer |
| History | Stores `AnalysisResult`s in `ArrayList` |
| File I/O | Load sequences from `.txt`, `.fa`, `.fasta` (FASTA headers ignored) and export history to `.txt` |

## Syllabus Coverage
- **Unit 1 & 2 (Datatypes, Strings, Operators, Control Statements)**: Sequence parsing/validation, GC-content/nucleotide calculations, input checks with if-else/loops/string ops.
- **Unit 3 (Classes, Objects, Constructors, Method Overloading)**: Classes like `AnalysisResult`, `SequenceAnalyzerService`; constructors; overloaded methods.
- **Unit 4 (Inheritance, Abstraction, Interfaces, Overriding)**: Abstract `GeneticSequence`; subclasses `DNASequence`/`RNASequence`; interface `Analyzable`; overrides for `analyze()`/`validate()`/`transcribeOrTransform()`.
- **Unit 5 (Exception Handling)**: Custom `InvalidNucleotideException`; try-catch-throw in service/UI.
- **Unit 6 (GUI)**: Swing `JFrame`/`JPanel`, input/output areas, button events.
- **Unit 7 (Collections)**: `ArrayList<AnalysisResult>` for history; enhanced for-loops.

## Project Structure
```
JavaProject/
├── README.md
├── src/
│   └── dnaanalyzer/
│       ├── Main.java
│       ├── exception/
│       │   └── InvalidNucleotideException.java
│       ├── model/
│       │   ├── Analyzable.java
│       │   ├── GeneticSequence.java
│       │   ├── DNASequence.java
│       │   ├── RNASequence.java
│       │   └── AnalysisResult.java
│       ├── repository/
│       │   └── AnalysisHistory.java
│       ├── service/
│       │   ├── SequenceValidator.java
│       │   └── SequenceAnalyzerService.java
│       └── ui/
│           ├── MainFrame.java
│           └── StrandVisualizer.java
├── out/ (compiled classes)
└── example.txt
```

## Quick Start
From project root (`c:/Users/hp/Desktop/JavaProject`):

### Manual Compile & Run (cmd/PowerShell)
```bash
javac -d out src/dnaanalyzer/*.java src/dnaanalyzer/*/*.java src/dnaanalyzer/*/*/*.java
java -cp out dnaanalyzer.Main
```

### One-liner PowerShell (Windows)
```powershell
New-Item -ItemType Directory -Force out | Out-Null; javac -d out (Get-ChildItem -Recurse -Filter *.java src | ForEach-Object { $_.FullName }); java -cp out dnaanalyzer.Main
```

Launches GUI for sequence input/analysis.

**Requirements**: JDK 25+ (detected on this system).

## License
MIT License - feel free to use/modify.

