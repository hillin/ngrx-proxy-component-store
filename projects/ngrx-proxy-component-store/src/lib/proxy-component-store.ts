import { ComponentStore } from "@ngrx/component-store";
import { Observable, Subscription } from "rxjs";

type AtomicObject = Function | Promise<any> | Date | RegExp;
type ReducerFunction<TValue> = (
  observableOrValue: TValue | Observable<TValue>
) => Subscription;
type PropertyEndPoint<TProperty> = Observable<TProperty> & {
  update: ReducerFunction<TProperty>;
};

type ObjectKeys<T extends object> = {
  [K in keyof T]-?: T[K] extends AtomicObject
    ? never
    : T[K] extends Array<any>
    ? never
    : T[K] extends object | undefined
    ? K
    : never;
}[keyof T];

export type PropertyProxy<
  TState extends object,
  TProperty = TState
> = TProperty extends object
  ? {
      +readonly [K in keyof TProperty as `${string & K}$`]-?: PropertyEndPoint<
        TProperty[K]
      >;
    } & {
      +readonly [K in ObjectKeys<TProperty>]-?: TProperty[K] extends
        | object
        | undefined
        ? PropertyProxy<TState, TProperty[K]>
        : never;
    }
  : never;

function createPropertyEndpoint<TState extends object>(
  store: ComponentStore<TState>,
  paths: string[]
): PropertyEndPoint<any> {
  const endpoint = store.select((state) => {
    let value: any = state;
    paths.forEach((path) => (value = value?.[path]));
    return value;
  }) as PropertyEndPoint<any>;

  endpoint.update = store.updater((state, value: any) => {
    const newState = { ...state };
    let parentObject: any = newState;
    const lastPathIndex = paths.length - 1;
    for (let i = 0; i < lastPathIndex; ++i) {
      const path = paths[i];
      let childObject = parentObject[path];
      if (childObject === undefined) {
        childObject = {};
        parentObject[path] = childObject;
      } else {
        childObject = { ...childObject };
        parentObject[path] = childObject;
      }
      parentObject = childObject;
    }

    parentObject[paths[lastPathIndex]] = value;
    return newState;
  });

  return endpoint;
}

function createPropertyProxy<TState extends object>(
  store: ComponentStore<TState>,
  target: any,
  paths: string[]
): PropertyProxy<TState> {
  const propertyEndPoints = new Map<string, PropertyEndPoint<any>>();
  const propertyProxies = new Map<string, PropertyProxy<TState>>();

  return new Proxy(target, {
    get(_target: any, prop: string | symbol) {
      if (prop in target) {
        return target[prop];
      }

      if (typeof prop !== "string") {
        return undefined;
      }

      if (prop.endsWith("$")) {
        let propertyEndpoint = propertyEndPoints.get(prop);
        if (!propertyEndpoint) {
          propertyEndpoint = createPropertyEndpoint(store, [
            ...paths,
            prop.substring(0, prop.length - 1),
          ]);
          propertyEndPoints.set(prop, propertyEndpoint);
        }
        return propertyEndpoint;
      }

      let propertProxy = propertyProxies.get(prop);
      if (!propertProxy) {
        propertProxy = createPropertyProxy(store, {}, [...paths, prop]);
        propertyProxies.set(prop, propertProxy);
      }

      return propertProxy;
    },
  });
}

/** Creates a state proxy for a component store to easily select and update state properties. */
export function proxify<TState extends object>(
  store: ComponentStore<TState>
): PropertyProxy<TState> {
  return createPropertyProxy(store, {}, []);
}

export class ProxyComponentStore<
  TState extends object
> extends ComponentStore<TState> {
  constructor(initialState: TState) {
    super(initialState);
  }

  readonly state = proxify(this);
}
