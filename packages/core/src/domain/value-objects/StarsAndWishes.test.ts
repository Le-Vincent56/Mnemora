import { describe, it, expect } from 'vitest';
import { StarsAndWishes } from './StarsAndWishes';

describe('StarsAndWishes', () => {
    describe('empty', () => {
        it('should create empty feedback', () => {
            const feedback = StarsAndWishes.empty();

            expect(feedback.stars).toHaveLength(0);
            expect(feedback.wishes).toHaveLength(0);
            expect(feedback.isEmpty).toBe(true);
            expect(feedback.collectedAt).toBeInstanceOf(Date);
        });
    });

    describe('addStar', () => {
        it('should add a star', () => {
            const feedback = StarsAndWishes.empty();
            const result = feedback.addStar('Great roleplay moment');

            expect(result.isSuccess).toBe(true);
            expect(result.value.stars).toEqual(['Great roleplay moment']);
            expect(result.value.isEmpty).toBe(false);
        });

        it('should trim whitespace', () => {
            const feedback = StarsAndWishes.empty();
            const result = feedback.addStar('  star with spaces  ');

            expect(result.isSuccess).toBe(true);
            expect(result.value.stars).toEqual(['star with spaces']);
        });

        it('should reject empty star', () => {
            const feedback = StarsAndWishes.empty();
            const result = feedback.addStar('');

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('empty');
        });

        it('should reject star exceeding 200 characters', () => {
            const feedback = StarsAndWishes.empty();
            const result = feedback.addStar('a'.repeat(201));

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('200');
        });

        it('should preserve immutability', () => {
            const feedback = StarsAndWishes.empty();
            const result = feedback.addStar('New star');

            expect(feedback.stars).toHaveLength(0);
            expect(result.value.stars).toHaveLength(1);
        });
    });

    describe('addWish', () => {
        it('should add a wish', () => {
            const feedback = StarsAndWishes.empty();
            const result = feedback.addWish('More exploration');

            expect(result.isSuccess).toBe(true);
            expect(result.value.wishes).toEqual(['More exploration']);
        });

        it('should reject empty wish', () => {
            const feedback = StarsAndWishes.empty();
            const result = feedback.addWish('   ');

            expect(result.isFailure).toBe(true);
        });
    });

    describe('removeStar', () => {
        it('should remove star at index', () => {
            let feedback = StarsAndWishes.empty();
            feedback = feedback.addStar('Star 1').value;
            feedback = feedback.addStar('Star 2').value;
            feedback = feedback.addStar('Star 3').value;

            const result = feedback.removeStar(1);

            expect(result.stars).toEqual(['Star 1', 'Star 3']);
        });

        it('should handle out of bounds index gracefully', () => {
            const feedback = StarsAndWishes.empty().addStar('Star').value;
            const result = feedback.removeStar(99);

            expect(result.stars).toEqual(['Star']);
        });
    });

    describe('removeWish', () => {
        it('should remove wish at index', () => {
            let feedback = StarsAndWishes.empty();
            feedback = feedback.addWish('Wish 1').value;
            feedback = feedback.addWish('Wish 2').value;

            const result = feedback.removeWish(0);

            expect(result.wishes).toEqual(['Wish 2']);
        });
    });

    describe('fromProps', () => {
        it('should reconstruct from props', () => {
            const props = {
                stars: ['Star 1', 'Star 2'],
                wishes: ['Wish 1'],
                collectedAt: new Date('2025-12-23')
            };

            const feedback = StarsAndWishes.fromProps(props);

            expect(feedback.stars).toEqual(['Star 1', 'Star 2']);
            expect(feedback.wishes).toEqual(['Wish 1']);
            expect(feedback.collectedAt).toEqual(new Date('2025-12-23'));
        });
    });
});