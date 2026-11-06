<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The result of every finished round / game (threshold, score, level...), details as JSON.
        Schema::create('exercise_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('exercise', 40);
            $table->date('date');
            $table->json('data');
            $table->timestamps();

            $table->index(['user_id', 'exercise', 'created_at']);
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_results');
    }
};
