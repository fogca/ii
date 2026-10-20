<script lang="ts">
	import { enhance } from '$app/forms';
	import { INQUIRY_TYPES } from './inquiry';
	import type { ActionData } from './$types';
	import type { FieldError, FormError } from './+page.server';

	let { form }: { form: ActionData } = $props();

	// /contact: one column at the left, as /type — the kind of inquiry, then
	// the fields, each label above a hairline input. Both languages are in
	// the page; html[data-lang] picks one (as on About and the works).
	const FIELD_ERRORS: Record<FieldError, { en: string; ja: string }> = {
		type: { en: 'Please choose a type of inquiry.', ja: 'お問い合わせの種別をお選びください。' },
		name: { en: 'Please enter your name.', ja: 'お名前をご入力ください。' },
		company: { en: 'Please keep this under 200 characters.', ja: '会社名は200文字以内でご入力ください。' },
		email: { en: 'Please enter a valid email address.', ja: '有効なメールアドレスをご入力ください。' },
		phone: { en: 'Please keep this under 40 characters.', ja: '電話番号は40文字以内でご入力ください。' },
		message: { en: 'Please write between 10 and 5,000 characters.', ja: 'メッセージは10〜5000文字でご入力ください。' }
	};

	const FORM_ERRORS: Record<FormError, { en: string; ja: string }> = {
		unconfigured: {
			en: 'The form isn’t available just now. Please write to us directly at',
			ja: '現在フォームをご利用いただけません。恐れ入りますが、こちらまで直接ご連絡ください:'
		},
		failed: {
			en: 'Your message could not be sent. Please try again later, or write to',
			ja: '送信に失敗しました。時間をおいて再度お試しいただくか、こちらまでご連絡ください:'
		},
		network: {
			en: 'Your message could not be sent. Please check your connection and try again, or write to',
			ja: '送信に失敗しました。通信環境をご確認のうえ再度お試しいただくか、こちらまでご連絡ください:'
		}
	};

	const FIELDS = [
		{ name: 'name', type: 'text', en: 'Name', ja: 'お名前', auto: 'name', required: true },
		{ name: 'company', type: 'text', en: 'Company', ja: '会社名', auto: 'organization', required: false },
		{ name: 'email', type: 'email', en: 'Email', ja: 'メールアドレス', auto: 'email', required: true },
		{ name: 'phone', type: 'tel', en: 'Phone', ja: '電話番号', auto: 'tel', required: false }
	] as const;

	type Values = { type: string; name: string; company: string; email: string; phone: string; message: string };
	const values = $derived<Partial<Values>>((form && 'values' in form ? form.values : undefined) ?? {});
	const errors = $derived<FieldError[]>((form && 'errors' in form ? (form.errors as FieldError[]) : undefined) ?? []);
	const formError = $derived(form && 'formError' in form ? (form.formError as FormError) : undefined);
	const fallback = $derived(form && 'fallback' in form ? (form.fallback as string) : undefined);
	const sent = $derived(!!(form && 'success' in form && form.success));

	let sending = $state(false);
</script>

<section class="Contact" aria-label="Contact">
	{#if sent}
		<div class="done" role="status">
			<p class="x-en" lang="en">Thank you. We have received your message and will reply within five business days.</p>
			<p class="x-ja" lang="ja">お問い合わせありがとうございます。内容を承りました。5営業日以内にご返信いたします。</p>
		</div>
	{:else}
		<form
			method="POST"
			novalidate
			use:enhance={() => {
				sending = true;
				return async ({ update }) => {
					await update({ reset: false });
					sending = false;
				};
			}}
		>
			<fieldset class="field types">
				<legend class="label">
					<span class="x-en" lang="en">Type of inquiry</span><span class="x-ja" lang="ja">お問い合わせ種別</span>
				</legend>
				<div class="options">
					{#each INQUIRY_TYPES as t, i (t.value)}
						<label class="option">
							<input
								type="radio"
								name="type"
								value={t.value}
								checked={values.type ? values.type === t.value : i === 0}
								required
							/>
							<span class="x-en" lang="en">{t.en}</span><span class="x-ja" lang="ja">{t.ja}</span>
						</label>
					{/each}
				</div>
				{@render error('type')}
			</fieldset>

			{#each FIELDS as f (f.name)}
				<label class="field">
					<span class="label">
						<span class="x-en" lang="en">{f.en}</span><span class="x-ja" lang="ja">{f.ja}</span>
						{#if !f.required}<span class="optional"
								><span class="x-en" lang="en">(optional)</span><span class="x-ja" lang="ja">（任意）</span></span
							>{/if}
					</span>
					<input
						class="input"
						type={f.type}
						name={f.name}
						autocomplete={f.auto}
						required={f.required}
						value={values[f.name] ?? ''}
						aria-invalid={errors.includes(f.name) || undefined}
					/>
					{@render error(f.name)}
				</label>
			{/each}

			<label class="field">
				<span class="label"><span class="x-en" lang="en">Message</span><span class="x-ja" lang="ja">メッセージ</span></span>
				<textarea
					class="input message"
					name="message"
					rows="8"
					required
					aria-invalid={errors.includes('message') || undefined}>{values.message ?? ''}</textarea
				>
				{@render error('message')}
			</label>

			<!-- Honeypot: hidden from people and off the tab order. -->
			<div class="hp" aria-hidden="true">
				<label>Website <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
			</div>

			{#if formError}
				<p class="form-error" role="alert">
					<span class="x-en" lang="en">{FORM_ERRORS[formError].en}</span><span class="x-ja" lang="ja"
						>{FORM_ERRORS[formError].ja}</span
					>
					<a href="mailto:{fallback}">{fallback}</a>
				</p>
			{/if}

			<button class="submit" type="submit" disabled={sending}>
				<span class="x-en" lang="en">{sending ? 'Sending…' : 'Send'}</span><span class="x-ja" lang="ja"
					>{sending ? '送信中…' : '送信する'}</span
				>
			</button>
		</form>
	{/if}
</section>

{#snippet error(name: FieldError)}
	{#if errors.includes(name)}
		<span class="error" role="alert">
			<span class="x-en" lang="en">{FIELD_ERRORS[name].en}</span><span class="x-ja" lang="ja">{FIELD_ERRORS[name].ja}</span>
		</span>
	{/if}
{/snippet}

<style>
	.Contact {
		min-height: 100vh;
		min-height: 100dvh;
		padding: 100px var(--gutter) 120px;
	}

	:global(html[data-lang='ja']) .x-en,
	:global(html:not([data-lang='ja'])) .x-ja {
		display: none;
	}

	form,
	.done {
		max-width: 560px;
	}

	.done {
		font-size: 16px;
		line-height: 1.6;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0 0 32px;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.label {
		padding: 0;
		font-size: 12.5px;
		line-height: 1.2;
	}

	.optional {
		margin-left: 0.4em;
		opacity: 0.5;
	}

	/* The kinds of inquiry as words; the chosen one gets the header's dot. */
	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 12px 32px;
		margin-top: 10px;
	}

	.option {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		cursor: pointer;
	}

	.option input {
		appearance: none;
		width: 9px;
		height: 9px;
		margin: 0;
		border: 1px solid currentColor;
		border-radius: 50%;
		cursor: pointer;
	}

	.option input:checked {
		background: currentColor;
	}

	.option input:focus-visible {
		outline: 1px solid currentColor;
		outline-offset: 3px;
	}

	/* A hairline underline; 16px so iOS doesn't zoom on focus. */
	.input {
		width: 100%;
		padding: 6px 0 8px;
		border: 0;
		border-bottom: 1px solid currentColor;
		border-radius: 0;
		background: none;
		color: inherit;
		font: inherit;
		font-size: 16px;
		line-height: 1.5;
		outline: none;
	}

	.input:focus {
		border-bottom-width: 2px;
		padding-bottom: 7px;
	}

	.message {
		resize: vertical;
		min-height: 160px;
	}

	.error,
	.form-error {
		font-size: 12.5px;
		line-height: 1.5;
		color: #c00;
	}

	.form-error {
		margin: 0 0 24px;
	}

	.form-error a {
		text-decoration: underline;
	}

	.hp {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	.submit {
		padding: 12px 28px;
		border: 1px solid currentColor;
		border-radius: 999px;
		background: none;
		color: inherit;
		font: inherit;
		font-size: 14px;
		cursor: pointer;
		transition:
			background-color 0.3s ease,
			color 0.3s ease;
	}

	.submit:hover:not(:disabled) {
		background: var(--color-text);
		color: var(--color-bg);
	}

	.submit:disabled {
		opacity: 0.5;
		cursor: default;
	}

	@media (min-width: 1024px) {
		.Contact {
			padding-top: 120px;
		}
	}
</style>
