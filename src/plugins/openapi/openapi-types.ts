export declare namespace OpenAPIV3 {
    export interface Document {
        openapi: string;
        info: InfoObject;
        servers?: ServerObject[];
        paths: PathsObject;
        components?: ComponentsObject;
        security?: SecurityRequirementObject[];
        tags?: TagObject[];
        externalDocs?: ExternalDocumentationObject;
    }
    export interface InfoObject {
        title: string;
        description?: string;
        termsOfService?: string;
        contact?: ContactObject;
        license?: LicenseObject;
        version: string;
    }
    export interface ContactObject {
        name?: string;
        url?: string;
        email?: string;
    }
    export interface LicenseObject {
        name: string;
        url?: string;
    }
    export interface ServerObject {
        url: string;
        description?: string;
        variables?: {
            [variable: string]: ServerVariableObject;
        };
    }
    export interface ServerVariableObject {
        enum?: string[];
        default: string;
        description?: string;
    }
    export interface PathsObject {
        [pattern: string]: PathItemObject;
    }
    export interface PathItemObject {
        $ref?: string;
        summary?: string;
        description?: string;
        get?: OperationObject;
        put?: OperationObject;
        post?: OperationObject;
        delete?: OperationObject;
        options?: OperationObject;
        head?: OperationObject;
        patch?: OperationObject;
        trace?: OperationObject;
        servers?: ServerObject[];
        parameters?: Array<ParameterObject>;
    }
    export interface OperationObject {
        tags?: string[];
        summary?: string;
        description?: string;
        externalDocs?: ExternalDocumentationObject;
        operationId?: string;
        parameters?: Array<ParameterObject>;
        requestBody?: RequestBodyObject;
        responses?: ResponsesObject;
        callbacks?: {
            [callback: string]: CallbackObject;
        };
        deprecated?: boolean;
        security?: SecurityRequirementObject[];
        servers?: ServerObject[];
    }
    export interface ExternalDocumentationObject {
        description?: string;
        url: string;
    }
    export interface ParameterObject extends ParameterBaseObject {
        name: string;
        in: string;
    }
    export interface HeaderObject extends ParameterBaseObject {}
    export interface ParameterBaseObject {
        description?: string;
        required?: boolean;
        deprecated?: boolean;
        allowEmptyValue?: boolean;
        style?: string;
        explode?: boolean;
        allowReserved?: boolean;
        schema?: SchemaObject;
        example?: any;
        examples?: {
            [media: string]: ExampleObject;
        };
        content?: {
            [media: string]: MediaTypeObject;
        };
    }
    export type NonArraySchemaObjectType = 'null' | 'boolean' | 'object' | 'number' | 'string' | 'integer';
    export type ArraySchemaObjectType = 'array';
    export type SchemaObject = ArraySchemaObject | NonArraySchemaObject;
    export interface ArraySchemaObject extends BaseSchemaObject {
        type: ArraySchemaObjectType;
        items: SchemaObject;
    }
    export interface NonArraySchemaObject extends BaseSchemaObject {
        type: NonArraySchemaObjectType;
    }
    export interface BaseSchemaObject {
        title?: string;
        description?: string;
        format?: string;
        default?: any;
        multipleOf?: number;
        maximum?: number;
        exclusiveMaximum?: boolean;
        minimum?: number;
        exclusiveMinimum?: boolean;
        maxLength?: number;
        minLength?: number;
        pattern?: string;
        additionalProperties?: boolean | SchemaObject;
        maxItems?: number;
        minItems?: number;
        uniqueItems?: boolean;
        maxProperties?: number;
        minProperties?: number;
        required?: string[];
        enum?: any[];
        properties?: {
            [name: string]: SchemaObject;
        };
        allOf?: Array<SchemaObject>;
        oneOf?: Array<SchemaObject>;
        anyOf?: Array<SchemaObject>;
        not?: SchemaObject;
        nullable?: boolean;
        discriminator?: DiscriminatorObject;
        readOnly?: boolean;
        writeOnly?: boolean;
        xml?: XMLObject;
        externalDocs?: ExternalDocumentationObject;
        example?: any;
        deprecated?: boolean;
    }
    export interface DiscriminatorObject {
        propertyName: string;
        mapping?: {
            [value: string]: string;
        };
    }
    export interface XMLObject {
        name?: string;
        namespace?: string;
        prefix?: string;
        attribute?: boolean;
        wrapped?: boolean;
    }

    export interface ExampleObject {
        summary?: string;
        description?: string;
        value?: any;
        externalValue?: string;
    }
    export interface MediaTypeObject {
        schema?: SchemaObject;
        example?: any;
        examples?: {
            [media: string]: ExampleObject;
        };
        encoding?: {
            [media: string]: EncodingObject;
        };
    }
    export interface EncodingObject {
        contentType?: string;
        headers?: {
            [header: string]: HeaderObject;
        };
        style?: string;
        explode?: boolean;
        allowReserved?: boolean;
    }
    export interface RequestBodyObject {
        description?: string;
        content: {
            [media: string]: MediaTypeObject;
        };
        required?: boolean;
    }
    export interface ResponsesObject {
        [code: string]: ResponseObject;
    }
    export interface ResponseObject {
        description: string;
        headers?: {
            [header: string]: HeaderObject;
        };
        content?: {
            [media: string]: MediaTypeObject;
        };
        links?: {
            [link: string]: LinkObject;
        };
    }
    export interface LinkObject {
        operationRef?: string;
        operationId?: string;
        parameters?: {
            [parameter: string]: any;
        };
        requestBody?: any;
        description?: string;
        server?: ServerObject;
    }
    export interface CallbackObject {
        [url: string]: PathItemObject;
    }
    export interface SecurityRequirementObject {
        [name: string]: string[];
    }
    export interface ComponentsObject {
        schemas?: {
            [key: string]: SchemaObject;
        };
        responses?: {
            [key: string]: ResponseObject;
        };
        parameters?: {
            [key: string]: ParameterObject;
        };
        examples?: {
            [key: string]: ExampleObject;
        };
        requestBodies?: {
            [key: string]: RequestBodyObject;
        };
        headers?: {
            [key: string]: HeaderObject;
        };
        securitySchemes?: {
            [key: string]: SecuritySchemeObject;
        };
        links?: {
            [key: string]: LinkObject;
        };
        callbacks?: {
            [key: string]: CallbackObject;
        };
    }
    export type SecuritySchemeObject =
        | HttpSecurityScheme
        | ApiKeySecurityScheme
        | OAuth2SecurityScheme
        | OpenIdSecurityScheme;
    export interface HttpSecurityScheme {
        type: 'http';
        description?: string;
        scheme: string;
        bearerFormat?: string;
    }
    export interface ApiKeySecurityScheme {
        type: 'apiKey';
        description?: string;
        name: string;
        in: string;
    }
    export interface OAuth2SecurityScheme {
        type: 'oauth2';
        flows: {
            implicit?: {
                authorizationUrl: string;
                refreshUrl?: string;
                scopes: {
                    [scope: string]: string;
                };
            };
            password?: {
                tokenUrl: string;
                refreshUrl?: string;
                scopes: {
                    [scope: string]: string;
                };
            };
            clientCredentials?: {
                tokenUrl: string;
                refreshUrl?: string;
                scopes: {
                    [scope: string]: string;
                };
            };
            authorizationCode?: {
                authorizationUrl: string;
                tokenUrl: string;
                refreshUrl?: string;
                scopes: {
                    [scope: string]: string;
                };
            };
        };
    }
    export interface OpenIdSecurityScheme {
        type: 'openIdConnect';
        description?: string;
        openIdConnectUrl: string;
    }
    export interface TagObject {
        name: string;
        description?: string;
        externalDocs?: ExternalDocumentationObject;
    }
}

export function isArraySchemaObject(
    schema: OpenAPIV3.SchemaObject
): schema is OpenAPIV3.ArraySchemaObject {
    return schema.type === 'array';
}

export function isNonArraySchemaObject(
    schema: OpenAPIV3.SchemaObject
): schema is OpenAPIV3.NonArraySchemaObject {
    return schema.type !== 'array';
}

export function isEnum(schema: OpenAPIV3.SchemaObject) {
    return schema.enum && schema.enum.length > 0;
}
