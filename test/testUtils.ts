import { Either, isLeft, isRight } from "fp-ts/lib/Either"
import { Option, isSome } from "fp-ts/lib/Option"

export function getRight<T>(either: Either<unknown, T>): T {
    if(isRight(either)) {
        return either.right
    }

    throw either.left
}

export function getLeft<T>(either: Either<T, unknown>): T {
    if(isLeft(either)) {
        return either.left
    }

    throw either.right
}

export function getValue<T>(option: Option<T>) : T {
    if(isSome(option)) {
        return option.value
    }

    throw new Error("Cannot extract value from None.")
}