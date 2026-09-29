<script lang="ts">
	// The II mark — geometry from Figma (node 79:139, "II"). Every size in
	// the designs (31.8 / 39.8 / 94.9 / 133.8 / 357.5px) is this same shape
	// scaled, so one component serves all of them; the parent sets the width
	// and the color (fill follows currentColor).
	let { label = 'II' }: { label?: string } = $props();
</script>

<svg
	class="Logo"
	viewBox="0 0 357.311 357.48"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label={label}
>
	<path
		d="M357.311 357.48H245.531V354.24L280.631 329.4V28.08L245.531 3.24002V0H357.311V3.24002L322.211 28.08V329.4L357.311 354.24V357.48Z"
		fill="currentColor"
	/>
	<path
		d="M111.78 357.48H6.10352e-05V354.24L35.1001 329.4V28.08L6.10352e-05 3.24002V0H111.78V3.24002L76.6801 28.08V329.4L111.78 354.24V357.48Z"
		fill="currentColor"
	/>
</svg>

<style>
	.Logo {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
</style>
