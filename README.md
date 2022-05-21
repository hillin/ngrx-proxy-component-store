# @ngrx-proxy-component-store

A proxy for @ngrx/component-store to reduce boilerplate.

This library uses a little bit of proxy magic to drastically reduce the boilerplate code you need to write when using @ngrx/component-store.

## Get Started

```
npm i ngrx-proxy-component-store
```
or 
```
yarn i ngrx-proxy-component-store
```

## One Example to Rule Them All

Say we have a `HeroState`:

```typescript
export interface HeroState {
  hp: number;
  equipment: {
    weapon: WeaponType;
  };
  /* Of course our hero has much more than these! */
}
```

And its corresponding `HeroComponentStore`:

### Before:

```typescript
class HeroComponentStore extends ComponentStore<HeroState> {
  readonly hp$ = this.select(state => state.hp);
  readonly weapon$ = this.select(state => state.equipment.weapon);
  readonly setHp = this.updater((state, hp: number) => ({ ...state, hp }));
  readonly setWeapon = this.updater((state, weapon: WeaponType) => ({
    ...state,
    // carefully reduce nested state
    equipment: { ...state.equipment, weapon },
  }));
  /* That's just for two properties. */
}
```

### After:
```typescript
// Note we derive from ProxyComponentStore instead of ComponentStore
class HeroComponentStore extends ProxyComponentStore<HeroState> {
  /* NOTHING. REALLY. */
}
```

To select or reduce the state, use the `state` proxy:

```typescript
  // returns an Observable<number>
  const hp$ = this.state.hp$;   

  // Observable<{ weapon: WeaponType }>
  const equipment$ = this.state.equipment$; 

  // nested state property can be accessed directly
  const weapon$ = this.state.equipment.weapon$;

  // I lied. hp$ behaves like an Observable, but actaully it's not. 
  // It also encapsulates an updater:
  this.state.hp$.update(42);

  // Nested updater, so we don't have to carefully reduce nested state
  this.state.equipment.weapon$.update(new BFG());
```

### Alternative Usage
If for some reason it's not desirable to derive your component store from `ProxyComponentStore`, you can always use the `proxify` function to create a proxy for a component store.

```typescript
readonly state = proxify(this);
```

## Features
- Generate selectors and updaters based on state definition.
- Support nested state, automatic `undefined` handling.
  - e.g. for state `{ nested?: { value: string; } }`, `state.nested.value$` returns an `Observer<string | undefined>`; calling `state.nested.value$.update('abc')` will actually reduce the state with `nested` set to `{ value: 'abc' }`.
- Cache selectors and updaters (so they won't be repeatedly generated).