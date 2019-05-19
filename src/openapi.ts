import { OpenAPIV3 } from './openapi-types';
const SwaggerParser = require('swagger-parser');

export async function getOpenAPIConfig(file: string = './openapi.json'): Promise<OpenAPIV3.Document> {
    let config: OpenAPIV3.Document;
    config = await SwaggerParser.dereference(file);
    return config;
}
