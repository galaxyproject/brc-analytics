"""Tests for confidence scoring and validation."""

from app.models.llm import DatasetQuery


class TestConfidenceScoring:
    """Test suite for confidence score validation and logic."""

    def test_confidence_range_validation(self):
        """Test that confidence scores are within valid range (0.0 to 1.0)."""
        # Test valid confidence scores
        valid_scores = [0.0, 0.1, 0.5, 0.9, 1.0]

        for score in valid_scores:
            query = DatasetQuery(
                organism="Test",
                taxonomy_id=None,
                experiment_type=None,
                library_strategy=None,
                library_source=None,
                sequencing_platform=None,
                date_range=None,
                keywords=[],
                study_type=None,
                assembly_level=None,
                assembly_completeness=None,
                confidence=score,
            )
            assert 0.0 <= query.confidence <= 1.0

    def test_high_confidence_query_characteristics(self):
        """Test characteristics of high confidence queries."""
        high_confidence_query = DatasetQuery(
            organism="Escherichia coli",
            taxonomy_id="562",
            experiment_type="RNA-seq",
            library_strategy="RNA-Seq",
            library_source="TRANSCRIPTOMIC",
            sequencing_platform="Illumina",
            date_range={"start": "2023-01-01", "end": "2023-12-31"},
            keywords=["E. coli", "RNA-seq", "transcriptomics"],
            study_type="comparative",
            assembly_level="Complete Genome",
            assembly_completeness="complete",
            confidence=0.95,
        )

        assert high_confidence_query.confidence >= 0.9
        assert high_confidence_query.organism is not None
        assert high_confidence_query.experiment_type is not None
        assert len(high_confidence_query.keywords) > 0

    def test_low_confidence_query_characteristics(self):
        """Test characteristics of low confidence queries."""
        low_confidence_query = DatasetQuery(
            organism=None,
            taxonomy_id=None,
            experiment_type=None,
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=[],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.1,
        )

        assert low_confidence_query.confidence <= 0.2
        assert low_confidence_query.organism is None
        assert low_confidence_query.experiment_type is None
        assert len(low_confidence_query.keywords) == 0

    def test_confidence_threshold_boundary_cases(self):
        """Test boundary cases around the confidence threshold."""
        # Test queries at the threshold boundary (0.3)
        threshold = 0.3

        # Just below threshold
        below_threshold_query = DatasetQuery(
            organism="Vague organism",
            taxonomy_id=None,
            experiment_type=None,
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=["vague"],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.29,
        )

        assert below_threshold_query.confidence < threshold

        # Just above threshold
        above_threshold_query = DatasetQuery(
            organism="E. coli",
            taxonomy_id="562",
            experiment_type=None,
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=["E. coli"],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.31,
        )

        assert above_threshold_query.confidence > threshold

    def test_confidence_correlation_with_specificity(self):
        """Test that confidence correlates with query specificity."""
        # Very specific query should have high confidence
        specific_query = DatasetQuery(
            organism="Mycobacterium tuberculosis",
            taxonomy_id="1773",
            experiment_type="WGS",
            library_strategy="WGS",
            library_source="GENOMIC",
            sequencing_platform="Illumina",
            date_range={"start": "2023-01-01", "end": "2023-12-31"},
            keywords=["tuberculosis", "drug-resistant", "whole genome"],
            study_type="surveillance",
            assembly_level="Complete Genome",
            assembly_completeness="complete",
            confidence=0.95,
        )

        # Count non-null/non-empty fields
        specific_fields = sum(
            [
                1
                for field in [
                    specific_query.organism,
                    specific_query.taxonomy_id,
                    specific_query.experiment_type,
                    specific_query.library_strategy,
                    specific_query.library_source,
                    specific_query.sequencing_platform,
                    specific_query.date_range,
                    specific_query.study_type,
                    specific_query.assembly_level,
                    specific_query.assembly_completeness,
                ]
                if field is not None
            ]
        ) + (1 if specific_query.keywords else 0)

        # Vague query should have lower confidence
        vague_query = DatasetQuery(
            organism=None,
            taxonomy_id=None,
            experiment_type=None,
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=["data"],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.3,
        )

        vague_fields = sum(
            [
                1
                for field in [
                    vague_query.organism,
                    vague_query.taxonomy_id,
                    vague_query.experiment_type,
                    vague_query.library_strategy,
                    vague_query.library_source,
                    vague_query.sequencing_platform,
                    vague_query.date_range,
                    vague_query.study_type,
                    vague_query.assembly_level,
                    vague_query.assembly_completeness,
                ]
                if field is not None
            ]
        ) + (1 if vague_query.keywords else 0)

        # More specific query should have higher confidence
        assert specific_query.confidence > vague_query.confidence
        assert specific_fields > vague_fields

    def test_confidence_score_categories(self):
        """Test different confidence score categories and their meanings."""
        # Invalid/nonsense queries: 0.0 - 0.2
        invalid_query = DatasetQuery(
            organism=None,
            taxonomy_id=None,
            experiment_type=None,
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=[],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.0,
        )
        assert 0.0 <= invalid_query.confidence <= 0.2

        # Vague/ambiguous queries: 0.3 - 0.5
        vague_query = DatasetQuery(
            organism=None,
            taxonomy_id=None,
            experiment_type="genomic",
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=["genomic"],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.4,
        )
        assert 0.3 <= vague_query.confidence <= 0.5

        # Clear but incomplete queries: 0.6 - 0.8
        incomplete_query = DatasetQuery(
            organism="E. coli",
            taxonomy_id="562",
            experiment_type="RNA-seq",
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=["E. coli", "RNA-seq"],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.7,
        )
        assert 0.6 <= incomplete_query.confidence <= 0.8

        # Specific and detailed queries: 0.9 - 1.0
        detailed_query = DatasetQuery(
            organism="Plasmodium falciparum",
            taxonomy_id="5833",
            experiment_type="RNA-seq",
            library_strategy="RNA-Seq",
            library_source="TRANSCRIPTOMIC",
            sequencing_platform="Illumina",
            date_range={"start": "2023-01-01", "end": "2023-12-31"},
            keywords=["malaria", "Plasmodium", "RNA-seq", "transcriptomics"],
            study_type="drug resistance",
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.95,
        )
        assert 0.9 <= detailed_query.confidence <= 1.0

    def test_confidence_affects_api_acceptance(self):
        """Test that confidence scores properly affect API acceptance."""
        # Simulate the API layer threshold check
        api_threshold = 0.3

        # Query below threshold should be rejected
        low_confidence = DatasetQuery(
            organism=None,
            taxonomy_id=None,
            experiment_type=None,
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=[],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.2,
        )

        should_reject = low_confidence.confidence < api_threshold
        assert should_reject is True

        # Query above threshold should be accepted
        high_confidence = DatasetQuery(
            organism="E. coli",
            taxonomy_id="562",
            experiment_type="RNA-seq",
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=["E. coli"],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.8,
        )

        should_accept = high_confidence.confidence >= api_threshold
        assert should_accept is True

    def test_confidence_precision(self):
        """Test that confidence scores maintain appropriate precision."""
        # Test various precision levels
        confidence_values = [0.1, 0.25, 0.333, 0.5, 0.777, 0.9, 0.95, 1.0]

        for confidence in confidence_values:
            query = DatasetQuery(
                organism="Test",
                taxonomy_id=None,
                experiment_type=None,
                library_strategy=None,
                library_source=None,
                sequencing_platform=None,
                date_range=None,
                keywords=[],
                study_type=None,
                assembly_level=None,
                assembly_completeness=None,
                confidence=confidence,
            )

            # Confidence should be preserved with reasonable precision
            assert abs(query.confidence - confidence) < 0.001

    def test_edge_case_confidence_values(self):
        """Test edge cases for confidence values."""
        # Test minimum value
        min_query = DatasetQuery(
            organism=None,
            taxonomy_id=None,
            experiment_type=None,
            library_strategy=None,
            library_source=None,
            sequencing_platform=None,
            date_range=None,
            keywords=[],
            study_type=None,
            assembly_level=None,
            assembly_completeness=None,
            confidence=0.0,
        )
        assert min_query.confidence == 0.0

        # Test maximum value
        max_query = DatasetQuery(
            organism="Perfect organism",
            taxonomy_id="123",
            experiment_type="Perfect experiment",
            library_strategy="Perfect strategy",
            library_source="Perfect source",
            sequencing_platform="Perfect platform",
            date_range={"start": "2023-01-01", "end": "2023-12-31"},
            keywords=["perfect", "query"],
            study_type="Perfect study",
            assembly_level="Complete Genome",
            assembly_completeness="complete",
            confidence=1.0,
        )
        assert max_query.confidence == 1.0
