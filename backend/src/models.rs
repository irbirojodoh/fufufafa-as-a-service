use serde::{Deserialize, Serialize};

/// Quote data model representing a single wisdom entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote {
    pub id: i64,
    pub quote: String,
    pub source_url: String,
    pub has_image: bool,
}

/// API response for quote endpoints (no image_url - use /api/wisdom/img/:id for images)
#[derive(Debug, Serialize)]
pub struct QuoteResponse {
    pub id: i64,
    pub quote: String,
    pub source_url: String,
}

impl Quote {
    /// Convert Quote to API response format
    pub fn to_response(&self) -> QuoteResponse {
        QuoteResponse {
            id: self.id,
            quote: self.quote.clone(),
            source_url: self.source_url.clone(),
        }
    }
}

/// Error response for API
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}
