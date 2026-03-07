

# Plan: Swap Coffee and Coffee+Sweet icon order

Simple swap in two files — put "Kaffe/te + sødt" before "Kaffe/te".

## Changes

### `src/components/tableplan/TableCard.tsx` (lines 236-246)
Reorder so `coffeeTeaSweet` icon renders first, then `coffeeOnly`.

### `src/components/tableplan/QuickNoteButtons.tsx` (lines 67-86)
Swap the two buttons so "Kaffe/te + sødt" appears before "Kaffe/te".

