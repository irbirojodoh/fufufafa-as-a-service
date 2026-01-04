# FUaaS API Documentation

**Fufufafa as a Service** - A satirical API serving memorable quotes from the legendary Kaskus forum user "fufufafa".

## Base URL

```
https://fuaas.irphotoarts.cloud
```

---

## Endpoints

### Get Random Quote

Returns a random wisdom quote from fufufafa.

```http
GET /api/wisdom/
```

#### Response

```json
{
  "quote": "Dia pasti alumni 212",
  "source_url": "https://m.kaskus.co.id/show_post/5dccc1f726377206a51d63ad"
}
```

#### Example

```bash
curl https://fuaas.irphotoarts.cloud/api/wisdom/
```

---

### Get Quote by ID

Returns a specific quote by its ID.

```http
GET /api/wisdom/:id
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Quote ID  |

#### Response

```json
{
  "quote": "Saya lagi membayangkan prabowo mendaki semeru...",
  "source_url": "https://web.archive.org/web/..."
}
```

#### Example

```bash
curl https://fuaas.irphotoarts.cloud/api/wisdom/1
```

#### Errors

| Status | Description |
|--------|-------------|
| 404 | Quote not found |

---

### Get Random Image

Returns a random quote screenshot as PNG image.

```http
GET /api/wisdom/img
```

#### Response

- **Content-Type:** `image/png`
- **Body:** Binary PNG image data

#### Example

```bash
curl https://fuaas.irphotoarts.cloud/api/wisdom/img --output random.png
```

---

### Get Image by ID

Returns the screenshot for a specific quote.

```http
GET /api/wisdom/img/:id
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Quote ID (1-1275) |

#### Response

- **Content-Type:** `image/png`
- **Body:** Binary PNG image data

#### Example

```bash
curl https://fuaas.irphotoarts.cloud/api/wisdom/img/47 --output quote47.png
```

#### Errors

| Status | Description |
|--------|-------------|
| 404 | Image not found (quotes 1276-1337 have no images) |

---

### Health Check

Simple health check endpoint.

```http
GET /health
```

#### Response

```
OK
```

---

## Response Schema

### Quote Object

| Field | Type | Description |
|-------|------|-------------|
| `quote` | string | The quote text |
| `source_url` | string | Original Kaskus post URL |

### Error Object

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Error message |

---

## CORS

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Rate Limits

Currently no rate limits are enforced. Please be respectful with your usage.

---

## Statistics

| Metric | Value |
|--------|-------|
| Total Quotes | 1337 |
| Quotes with Images | 1275 |
| Image Format | PNG |

---

## Examples

### JavaScript (Fetch)

```javascript
// Get random quote
const response = await fetch('https://fuaas.irphotoarts.cloud/api/wisdom/');
const data = await response.json();
console.log(data.quote);
```

### Python (Requests)

```python
import requests

# Get quote by ID
response = requests.get('https://fuaas.irphotoarts.cloud/api/wisdom/47')
data = response.json()
print(data['quote'])
```

### HTML (Image Embed)

```html
<img src="https://fuaas.irphotoarts.cloud/api/wisdom/img/1" alt="Fufufafa Quote">
```

---

## Source

Quotes are sourced from the Kaskus forum posts of user **fufufafa**, preserved for satirical and archival purposes.

GitHub: [irbirojodoh/fufufafa-as-a-service](https://github.com/irbirojodoh/fufufafa-as-a-service)
