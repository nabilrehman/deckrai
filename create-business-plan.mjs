import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51SU1213ZT6RXP9jPwIY6Vp1PkshtFGLGiZhBI7krJ7cazepFGHPeykBR0n8aARo9AJGwqgzEhITNvU9V3TgCUWnQ00dlFsXRRu', {
  apiVersion: '2024-11-20.acacia',
});

async function createBusinessPlan() {
  try {
    console.log('🔧 Creating Business Plan product...\n');

    // Create Business product
    const businessProduct = await stripe.products.create({
      name: 'Business Plan',
      description: '250 slides per month, Style Library, Brand Adherence, Priority support',
      metadata: {
        plan: 'business',
        slides_per_month: '250',
        decks_per_month: '50'
      }
    });

    console.log(`✅ Business product created: ${businessProduct.id}`);

    // Create $99/month price
    const businessPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan: 'business',
        slides_per_month: '250',
        decks_per_month: '50'
      }
    });

    console.log(`✅ Business price created: ${businessPrice.id}`);
    console.log(`   Amount: $99.00/month\n`);

    console.log('\n📝 UPDATE YOUR CONFIG FILE WITH:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`starter: {`);
    console.log(`  stripePriceId: 'price_1SVp1L3ZT6RXP9jPJmKvhbln',`);
    console.log(`}\n`);
    console.log(`business: {`);
    console.log(`  stripePriceId: '${businessPrice.id}',`);
    console.log(`}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createBusinessPlan();
