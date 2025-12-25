use serde::{Deserialize, Serialize};

/// Quote data model representing a single wisdom entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote {
    pub id: i64,
    pub quote: String,
    pub source_url: String,
    pub has_image: bool,
}

/// API response for quote endpoints
#[derive(Debug, Serialize)]
pub struct QuoteResponse {
    pub quote: String,
    pub source_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
}

impl Quote {
    /// Convert Quote to API response format
    pub fn to_response(&self, base_url: &str) -> QuoteResponse {
        QuoteResponse {
            quote: self.quote.clone(),
            source_url: self.source_url.clone(),
            image_url: if self.has_image {
                Some(format!("{}/api/wisdom/img/{}", base_url, self.id))
            } else {
                None
            },
        }
    }
}

/// Error response for API
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}
