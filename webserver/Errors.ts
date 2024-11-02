interface BaseErrorConstructor {
    name: string,
    message: string;
    cause: unknown
    errorCode: number;
}

export class BaseError extends Error {

    errorCode: number;

    constructor(properties: BaseErrorConstructor) {

        super(properties.message);
        this.name = properties.name;
        this.message = properties.message;
        this.cause = properties.cause;
        this.errorCode = properties.errorCode;

    }

}

export class AuthorizationError extends BaseError {
    
        constructor(error: unknown, message: string = "Authorization error, the accessToken is invalid for this username") {
            super({
                name: "AuthorizationError",
                message: message,
                cause: error,
                errorCode: 401
            });
        }
    
    }

export class NoBalanceError extends BaseError {

    constructor(error: unknown, message: string = "No balance available") {
        super({
            name: "NoBalanceError",
            message: message,
            cause: error,
            errorCode: 400
        });
    }

}

export class MalformedRequestError extends BaseError {

    constructor(error: unknown, message: string = "Malformed request") {
        super({
            name: "MalformedRequestError",
            message: message,
            cause: error,
            errorCode: 400
        });
    }
}

export class InternalServerError extends BaseError {

    constructor(error: unknown, message: string = "Internal server error") {
        super({
            name: "InternalServerError",
            message: message,
            cause: error,
            errorCode: 500
        });
    }
}

export class UserError extends BaseError {

    constructor(error: unknown, message: string = "User error") {
        super({
            name: "UserError",
            message: message,
            cause: error,
            errorCode: 400
        });
    }
}

export class ThirdPartyError extends BaseError {

    constructor(error: unknown, message: string = "Third party error") {
        super({
            name: "ThirdPartyError",
            message: message,
            cause: error,
            errorCode: 500
        });
    }
}

export class NotInPregameError extends BaseError {
    
        constructor(error: unknown, message: string = "Not in pregame") {
            super({
                name: "NotInPregameError",
                message: message,
                cause: error,
                errorCode: 404
            });
        }

}