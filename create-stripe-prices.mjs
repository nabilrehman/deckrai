import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51SU1213ZT6RXP9jPwIY6Vp1PkshtFGLGiZhBI7krJ7cazepFGHPeykBR0n8aARo9AJGwqgzEhITNvU9V3TgCUWnQ00dlFsXRRu', {
  apiVersion: '2024-11-20.acacia',
});

async function createPrices() {
  try {
    console.log('🔧 Creating Stripe products and prices...\n');

    // Update existing Starter product to $19/month
    console.log('1️⃣ Updating Starter Plan...');
    const starterProductId = 'prod_TQsu4kLKokLPoO'; // Existing Starter product

    // Update product
    await stripe.products.update(starterProductId, {
      name: 'Starter Plan',
      description: '75 slides per month, Advanced AI models, No watermarks'
    });

    // Create new $19 price
    const starterPrice = await stripe.prices.create({
      product: starterProductId,
      unit_amount: 1900, // $19.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan: 'starter',
        slides_per_month: '75',
        decks_per_month: '15'
      }
    });

    // Set new price as default
    await stripe.products.update(starterProductId, {
      default_price: starterPrice.id
    });

    // Now archive old $10 price
    await stripe.prices.update('price_1SU18i3ZT6RXP9jPPS1gqQML', {
      active: false
    });

    console.log(`✅ Starter Plan updated!`);
    console.log(`   Product ID: ${starterProductId}`);
    console.log(`   Price ID: ${starterPrice.id}`);
    console.log(`   Amount: $19.00/month\n`);

    // Update existing Business product to $99/month
    console.log('2️⃣ Updating Business Plan...');
    const businessProductId = 'prod_TQsxoIzS5Bdj6s'; // Existing Business product

    // Update product
    await stripe.products.update(businessProductId, {
      name: 'Business Plan',
      description: '250 slides per month, Style Library, Brand Adherence, Priority support'
    });

    // Create new $99 price
    const businessPrice = await stripe.prices.create({
      product: businessProductId,
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

    // Set new price as default
    await stripe.products.update(businessProductId, {
      default_price: businessPrice.id
    });

    // Now archive old $70 price
    await stripe.prices.update('price_1SU1BS3ZT6RXP9jPj6oNdvEe', {
      active: false
    });

    console.log(`✅ Business Plan updated!`);
    console.log(`   Product ID: ${businessProductId}`);
    console.log(`   Price ID: ${businessPrice.id}`);
    console.log(`   Amount: $99.00/month\n`);

    console.log('\n📝 UPDATE YOUR CONFIG FILE WITH:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`starter: {`);
    console.log(`  stripePriceId: '${starterPrice.id}',`);
    console.log(`}\n`);
    console.log(`business: {`);
    console.log(`  stripePriceId: '${businessPrice.id}',`);
    console.log(`}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createPrices();
