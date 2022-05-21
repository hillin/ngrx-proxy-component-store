# @ngrx-proxy-component-store

A proxy for @ngrx/component-store to reduce boilerplate.

This library uses a little bit of proxy magic to drastically reduce the boilerplate code you need to write when using @ngrx/component-store.

## Get Started

```
npm i ngrx-proxy-component-store
```

## One Example to Rule Them All

Say we have a `HeroState`:

```typescript
export interface HeroState {
  hp: number;
  equipment: {
    weapon: WeaponType;
  };
  /* Of course our hero has much more than this! */
}
```

And its corresponding `HeroComponentStore`:

### Before:

```typescript
class HeroComponentStore extends ComponentStore<HeroState> {
  readonly hp$ = this.select(state => state.hp);
  readonly weapon$ = this.select(state => state.equipment.armor);
  readonly setHp = this.updater((state, hp: number) => ({ ...state, hp }));
  readonly setWeapon = this.updater((state, weapon: WeaponType) => ({
    ...state,
    equipment: { ...state.equipment, weapon },
  }));
  /* That's just for two properties. */
}
```

### After:
```typescript
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

  // I lied, hp$ is not only an Observable, it also encapsulates an updater
  this.state.hp$.update(42);

  // Nested updater, so we don't have to carefully reduce nested state
  this.state.equipment.weapon$.update(new BFG());
```