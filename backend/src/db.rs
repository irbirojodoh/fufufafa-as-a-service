use worker::*;
use crate::models::Quote;

/// Get the total count of quotes in the database
pub async fn get_total_count(db: &D1Database) -> Result<i64> {
    let statement = db.prepare("SELECT COUNT(*) as count FROM quotes");
    let result = statement.first::<serde_json::Value>(None).await?;
    
    match result {
        Some(row) => {
            let count = row.get("count")
                .and_then(|v| v.as_i64())
                .unwrap_or(0);
            Ok(count)
        }
        None => Ok(0),
    }
}

/// Get a random quote from the database
pub async fn get_random_quote(db: &D1Database) -> Result<Option<Quote>> {
    let count = get_total_count(db).await?;
    if count == 0 {
        return Ok(None);
    }
    
    // Generate random ID between 1 and count
    let random_id = (rand::random::<u64>() % count as u64) + 1;
    
    get_quote_by_id(db, random_id as i64).await
}

/// Get a specific quote by ID
pub async fn get_quote_by_id(db: &D1Database, id: i64) -> Result<Option<Quote>> {
    let statement = db
        .prepare("SELECT id, quote, source_url, has_image FROM quotes WHERE id = ?")
        .bind(&[id.into()])?;
    
    let result = statement.first::<Quote>(None).await?;
    Ok(result)
}

/// Check if a quote has an associated image
pub async fn has_image(db: &D1Database, id: i64) -> Result<bool> {
    let statement = db
        .prepare("SELECT has_image FROM quotes WHERE id = ?")
        .bind(&[id.into()])?;
    
    let result = statement.first::<serde_json::Value>(None).await?;
    
    match result {
        Some(row) => {
            let has_img = row.get("has_image")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            Ok(has_img)
        }
        None => Ok(false),
    }
}

/// Get a random quote ID that has an image
pub async fn get_random_image_id(db: &D1Database) -> Result<Option<i64>> {
    let statement = db.prepare(
        "SELECT id FROM quotes WHERE has_image = 1 ORDER BY RANDOM() LIMIT 1"
    );
    
    let result = statement.first::<serde_json::Value>(None).await?;
    
    match result {
        Some(row) => {
            let id = row.get("id").and_then(|v| v.as_i64());
            Ok(id)
        }
        None => Ok(None),
    }
}
