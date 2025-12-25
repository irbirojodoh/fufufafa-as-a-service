use worker::*;

mod db;
mod models;

use models::{ErrorResponse, QuoteResponse};

fn log_request(req: &Request) {
    console_log!(
        "{} - [{}]",
        Date::now().to_string(),
        req.path(),
    );
}

fn json_response<T: serde::Serialize>(data: &T, status: u16) -> Result<Response> {
    let json = serde_json::to_string(data)?;
    let mut headers = Headers::new();
    headers.set("Content-Type", "application/json")?;
    headers.set("Access-Control-Allow-Origin", "*")?;
    
    Ok(Response::ok(json)?
        .with_headers(headers)
        .with_status(status))
}

fn error_response(message: &str, status: u16) -> Result<Response> {
    json_response(&ErrorResponse { error: message.to_string() }, status)
}

#[event(fetch)]
async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    log_request(&req);
    
    // Set up panic hook for better error messages
    console_error_panic_hook::set_once();
    
    let router = Router::new();
    
    router
        // GET /api/wisdom/ - Random quote
        .get_async("/api/wisdom/", |req, ctx| async move {
            let db = ctx.env.d1("DB")?;
            
            match db::get_random_quote(&db).await? {
                Some(quote) => {
                    let url = req.url()?;
                    let base_url = format!("{}://{}", url.scheme(), url.host_str().unwrap_or("localhost"));
                    json_response(&quote.to_response(&base_url), 200)
                }
                None => error_response("No quotes found", 404),
            }
        })
        
        // GET /api/wisdom/:id - Specific quote by ID
        .get_async("/api/wisdom/:id", |req, ctx| async move {
            let id: i64 = ctx.param("id")
                .ok_or_else(|| Error::from("Missing ID parameter"))?
                .parse()
                .map_err(|_| Error::from("Invalid ID format"))?;
            
            let db = ctx.env.d1("DB")?;
            
            match db::get_quote_by_id(&db, id).await? {
                Some(quote) => {
                    let url = req.url()?;
                    let base_url = format!("{}://{}", url.scheme(), url.host_str().unwrap_or("localhost"));
                    json_response(&quote.to_response(&base_url), 200)
                }
                None => error_response("Quote not found", 404),
            }
        })
        
        // GET /api/wisdom/img - Random image
        .get_async("/api/wisdom/img", |_req, ctx| async move {
            let db = ctx.env.d1("DB")?;
            let bucket = ctx.env.bucket("IMAGES")?;
            
            match db::get_random_image_id(&db).await? {
                Some(id) => {
                    let key = format!("{}.png", id);
                    match bucket.get(&key).execute().await? {
                        Some(object) => {
                            let body = object.body()
                                .ok_or_else(|| Error::from("No image body"))?;
                            let bytes = body.bytes().await?;
                            
                            let mut headers = Headers::new();
                            headers.set("Content-Type", "image/png")?;
                            headers.set("Cache-Control", "public, max-age=86400")?;
                            headers.set("Access-Control-Allow-Origin", "*")?;
                            
                            Ok(Response::from_bytes(bytes)?.with_headers(headers))
                        }
                        None => error_response("Image not found", 404),
                    }
                }
                None => error_response("No images available", 404),
            }
        })
        
        // GET /api/wisdom/img/:id - Specific image by ID
        .get_async("/api/wisdom/img/:id", |_req, ctx| async move {
            let id: i64 = ctx.param("id")
                .ok_or_else(|| Error::from("Missing ID parameter"))?
                .parse()
                .map_err(|_| Error::from("Invalid ID format"))?;
            
            let db = ctx.env.d1("DB")?;
            let bucket = ctx.env.bucket("IMAGES")?;
            
            // Check if this quote has an image
            if !db::has_image(&db, id).await? {
                return error_response("Quote does not have an image", 404);
            }
            
            let key = format!("{}.png", id);
            match bucket.get(&key).execute().await? {
                Some(object) => {
                    let body = object.body()
                        .ok_or_else(|| Error::from("No image body"))?;
                    let bytes = body.bytes().await?;
                    
                    let mut headers = Headers::new();
                    headers.set("Content-Type", "image/png")?;
                    headers.set("Cache-Control", "public, max-age=86400")?;
                    headers.set("Access-Control-Allow-Origin", "*")?;
                    
                    Ok(Response::from_bytes(bytes)?.with_headers(headers))
                }
                None => error_response("Image file not found", 404),
            }
        })
        
        // Health check endpoint
        .get("/health", |_, _| {
            Response::ok("OK")
        })
        
        // CORS preflight
        .options("/api/wisdom/*path", |_, _| {
            let mut headers = Headers::new();
            headers.set("Access-Control-Allow-Origin", "*")?;
            headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")?;
            headers.set("Access-Control-Allow-Headers", "Content-Type")?;
            Ok(Response::empty()?.with_headers(headers).with_status(204))
        })
        
        .run(req, env)
        .await
}
